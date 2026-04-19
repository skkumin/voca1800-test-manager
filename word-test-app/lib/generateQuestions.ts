import { supabase } from './supabase';
import { Word, Question } from './types';

/**
 * 단어별 미출제 예문을 우선 선택한다.
 * 미출제 예문 없으면 가장 오래된 예문을 선택한다.
 */
export async function chooseSentence(word: Word): Promise<{ word: Word; sentenceIndex: number }> {
  // 1. sentence_usage 조회: 이 word의 각 예문 사용 횟수
  const { data: usage, error } = await supabase
    .from('sentence_usage')
    .select('sentence_index, created_at')
    .eq('word_id', word.id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // 2. 사용 횟수를 그룹화
  const usedIndices = new Map<number, number>();
  usage?.forEach(u => {
    usedIndices.set(u.sentence_index, (usedIndices.get(u.sentence_index) || 0) + 1);
  });

  // 3. 미출제 예문 찾기
  const unaskedIndices = word.sentences
    .map((_, idx) => idx)
    .filter(idx => !usedIndices.has(idx));

  let selectedIndex: number;

  if (unaskedIndices.length > 0) {
    // 미출제 예문 우선 선택
    selectedIndex = unaskedIndices[Math.floor(Math.random() * unaskedIndices.length)];
  } else {
    // 미출제 없으면 가장 오래된 예문 선택
    const sortedByUsage = Array.from(usedIndices.keys()).sort(
      (a, b) => (usedIndices.get(a) || 0) - (usedIndices.get(b) || 0)
    );
    selectedIndex = sortedByUsage[0];
  }

  return { word, sentenceIndex: selectedIndex };
}

/**
 * 문장에서 단어를 _____ 로 치환한다.
 * 대소문자 무시, 단어 경계 기준 (ADR-009)
 */
export function blankWord(sentence: string, word: string): string {
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
  return sentence.replace(regex, '_____');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 다른 DAY의 단어에서 N개 오답을 선택한다 (ADR-010)
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

  // Fisher-Yates shuffle
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
  // 1. 예문 선택
  const { sentenceIndex } = await chooseSentence(word);
  const sentence = word.sentences[sentenceIndex];

  // 2. Blank 처리
  const question = blankWord(sentence, word.word);

  // 3. 오답 선택
  const wrongWords = await selectWrongAnswers(word, selectedDays, 4);

  // 4. 보기 섞기
  const { choices, answer } = shuffleChoices(word.word, wrongWords);

  return {
    id: 0, // ID는 나중에 부여
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
  // 1. 대상 단어 조회
  let targetWords: Word[];
  if (mode === 'day_select') {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .in('day', days);
    if (error) throw error;
    targetWords = data as Word[];
  } else {
    // mode === 'unasked': 전체 단어 중 미출제 예문이 있는 단어 우선
    const { data, error } = await supabase
      .from('words')
      .select('*');
    if (error) throw error;
    targetWords = data as Word[];
  }

  if (targetWords.length < count) {
    throw new Error(`Not enough words. Need ${count}, got ${targetWords.length}`);
  }

  // 2. N개 단어 랜덤 선택
  const selectedWords: Word[] = [];
  const wordsCopy = [...targetWords];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * wordsCopy.length);
    selectedWords.push(wordsCopy[idx]);
    wordsCopy.splice(idx, 1);
  }

  // 3. 각 단어별 문제 생성
  const questionsWithMeta = await Promise.all(
    selectedWords.map((word, idx) => generateOneQuestion(word, days))
  );

  // 4. ID와 문제 구조 정리
  const questions: Question[] = questionsWithMeta.map((q, idx) => ({
    id: idx,
    word: q.word,
    question: q.question,
    choices: q.choices,
    answer: q.answer,
    sentenceIndex: q.sentenceIndex
  }));

  // 5. tests 테이블에 저장
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

  // 6. sentence_usage 기록
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
