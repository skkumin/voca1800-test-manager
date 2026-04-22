import { supabase } from './supabase';
import { Word, WordQuestion, Question } from './types';

/**
 * 단어별 미출제 예문을 우선 선택한다.
 * 미출제 예문 없으면 가장 오래된 예문을 선택한다.
 */
export async function chooseSentence(word: Word): Promise<{ word: Word; sentenceIndex: number }> {
  if (word.questions.length === 0) {
    throw new Error(`${word.word} has no testable questions`);
  }

  const { data: usage, error } = await supabase
    .from('sentence_usage')
    .select('sentence_index, created_at')
    .eq('word_id', word.id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const usedIndices = new Map<number, number>();
  usage?.forEach(u => {
    usedIndices.set(u.sentence_index, (usedIndices.get(u.sentence_index) || 0) + 1);
  });

  const unaskedIndices = word.questions
    .map((_, idx) => idx)
    .filter(idx => !usedIndices.has(idx));

  let selectedIndex: number;

  if (unaskedIndices.length > 0) {
    selectedIndex = unaskedIndices[Math.floor(Math.random() * unaskedIndices.length)];
  } else {
    const sortedByUsage = Array.from(usedIndices.keys()).sort(
      (a, b) => (usedIndices.get(a) || 0) - (usedIndices.get(b) || 0)
    );
    selectedIndex = sortedByUsage[0];
  }

  return { word, sentenceIndex: selectedIndex };
}

/**
 * 예문의 미리 계산된 좌표로 정확하게 빈칸을 뚫는다.
 */
export function blankWord(q: WordQuestion): string {
  return q.original.slice(0, q.start) + '_____' + q.original.slice(q.end);
}

/**
 * 다른 DAY의 단어에서 N개 오답을 선택한다
 */
export async function selectWrongAnswers(
  correctWord: Word,
  selectedDays: string[],
  count: number = 4
): Promise<Word[]> {
  const { data: wrongWords, error } = await supabase
    .from('words')
    .select('*')
    .not('day', 'in', `(${selectedDays.map(d => `'${d}'`).join(',')})`)
    .neq('id', correctWord.id)
    .limit(count);

  if (error) throw error;

  if (!wrongWords || wrongWords.length < count) {
    throw new Error(`Not enough wrong answers available. Need ${count}, got ${wrongWords?.length || 0}`);
  }

  return wrongWords.slice(0, count) as Word[];
}

/**
 * 보기 5개를 섞는다 (Fisher-Yates shuffle)
 */
export function shuffleChoices(
  correctWord: string,
  wrongWords: Word[]
): { choices: string[]; answer: number } {
  const choices = [
    correctWord,
    ...wrongWords.map(w => w.word)
  ];

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  const answerIndex = choices.indexOf(correctWord);
  return { choices, answer: answerIndex };
}

/**
 * 1개 문제 생성
 */
export async function generateOneQuestion(
  word: Word,
  selectedDays: string[]
): Promise<Question & { sentenceIndex: number }> {
  const { sentenceIndex } = await chooseSentence(word);
  const q = word.questions[sentenceIndex];

  const question = blankWord(q);

  const wrongWords = await selectWrongAnswers(word, selectedDays, 4);
  const { choices, answer } = shuffleChoices(word.word, wrongWords);

  return {
    id: 0,
    word: word.word,
    question,
    choices,
    answer,
    sentenceIndex
  };
}

/**
 * 시험 문제 N개 생성
 */
export async function generateQuestions(
  mode: 'day_select' | 'unasked',
  days: string[],
  count: number
): Promise<{ questions: Question[]; testId: string }> {
  let targetWords: Word[];

  if (mode === 'day_select') {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .in('day', days)
      .neq('questions', '[]');
    if (error) throw error;
    targetWords = data as Word[];
  } else {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .neq('questions', '[]');
    if (error) throw error;
    targetWords = data as Word[];
  }

  // 출제 가능한 단어 수로 자동 제한
  const effectiveCount = Math.min(count, targetWords.length);

  if (effectiveCount === 0) {
    throw new Error('출제 가능한 단어가 없습니다.');
  }

  const selectedWords: Word[] = [];
  const wordsCopy = [...targetWords];
  for (let i = 0; i < effectiveCount; i++) {
    const idx = Math.floor(Math.random() * wordsCopy.length);
    selectedWords.push(wordsCopy[idx]);
    wordsCopy.splice(idx, 1);
  }

  const questionsWithMeta = await Promise.all(
    selectedWords.map((word) => generateOneQuestion(word, days))
  );

  const questions: Question[] = questionsWithMeta.map((q, idx) => ({
    id: idx,
    word: q.word,
    question: q.question,
    choices: q.choices,
    answer: q.answer,
    sentenceIndex: q.sentenceIndex
  }));

  const testId = `T${Date.now()}`;
  const { error: insertError } = await supabase
    .from('tests')
    .insert({
      test_id: testId,
      days,
      mode,
      questions
    });

  if (insertError) throw insertError;

  const usageRecords = questionsWithMeta.map(q => ({
    word_id: selectedWords.find(w => w.word === q.word)!.id,
    sentence_index: q.sentenceIndex,
    test_id: testId
  }));

  const { error: usageError } = await supabase
    .from('sentence_usage')
    .insert(usageRecords);

  if (usageError) throw usageError;

  return { questions, testId };
}
