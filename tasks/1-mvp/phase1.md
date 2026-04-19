# Phase 1: 문제 생성 핵심 로직

## 사전 준비

관련 문서 읽기:
- `docs/PRD.md` (기능 1: 시험 생성)
- `docs/DATA-SCHEMA.md` (sentence_usage 테이블 설명)
- `docs/CODE-ARCHITECTURE.md` (lib/generateQuestions.ts 설명)
- `docs/ADR.md` (ADR-009, ADR-010)

이전 phase 산출물:
- Phase 0에서 생성된 `lib/supabase.ts`, `lib/types.ts`
- Supabase 스키마 및 초기 데이터 완성

---

## 작업 내용

### 1. 예문 선택 로직 (미출제 우선)

`lib/generateQuestions.ts` 생성:

```typescript
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

  // 2. 사용 횟수를 센트를 그룹화
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
  wrongWords: Word[],
  correctPosition: number
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
  const { choices, answer } = shuffleChoices(word.word, wrongWords, 0);

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
```

### 2. 타입 확장 (lib/types.ts 업데이트)

Word 인터페이스에 `id` 필드 추가:
```typescript
export interface Word {
  id: string;  // UUID
  word: string;
  meaning: string;
  sentences: string[];
  day: string;
}
```

### 3. 테스트 작성 (lib/generateQuestions.test.ts)

```typescript
import { blankWord, shuffleChoices } from './generateQuestions';

describe('generateQuestions', () => {
  describe('blankWord', () => {
    it('should replace word with blank (case-insensitive)', () => {
      const sentence = "The drink would quench the local population's thirst.";
      const result = blankWord(sentence, 'thirst');
      expect(result).toBe("The drink would quench the local population's _____.");
    });

    it('should not replace partial matches', () => {
      const sentence = "We thirst for retribution.";
      const result = blankWord(sentence, 'thirst');
      expect(result).toBe("We _____ for retribution.");
    });

    it('should ignore case', () => {
      const sentence = "We THIRST for retribution.";
      const result = blankWord(sentence, 'thirst');
      expect(result).toBe("We _____ for retribution.");
    });
  });

  describe('shuffleChoices', () => {
    it('should return 5 choices with correct answer', () => {
      const choices = ['word1', 'word2', 'word3', 'word4'];
      const result = shuffleChoices('thirst', choices.slice(1).map(w => ({ word: w } as any)), 0);
      
      expect(result.choices.length).toBe(5);
      expect(result.choices).toContain('thirst');
      expect(result.answer >= 0 && result.answer < 5).toBe(true);
      expect(result.choices[result.answer]).toBe('thirst');
    });
  });
});
```

---

## Acceptance Criteria

```bash
# TypeScript 컴파일 확인
npm run build
# → 에러 없음

# 테스트 실행
npm test -- lib/generateQuestions
# → 모든 테스트 통과

# 수동 테스트 (Node 환경에서)
node -e "
const { blankWord } = require('./lib/generateQuestions');
console.log(blankWord('The drink would quench the thirst.', 'thirst'));
// → The drink would quench the _____.
"
```

## AC 검증 방법

1. `npm run build` 실행 → 컴파일 에러 없음
2. `npm test` 실행 → 모든 테스트 통과
3. 수동 테스트로 blankWord 정규식 동작 확인

모두 통과하면 `/tasks/1-mvp/index.json`의 phase 1 status를 `"completed"`로 변경하라.

## 주의사항

- Supabase 쿼리는 반드시 에러 처리 필수 (error 객체 체크)
- sentence_usage 삽입 실패 시 tests 데이터가 orphaned되지 않도록 주의
- 미출제 예문이 정확히 선택되는지 로컬에서 테스트 필수 (DB 없이 로직만 테스트 가능)
- ADR-009, ADR-010 규칙 반드시 준수
