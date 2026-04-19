# DATA-SCHEMA: 데이터 구조

## 개요

**설계 원칙**:
- 예문별 출제 이력을 전역으로 추적 (중복 방지의 핵심)
- TEXT[] 배열로 복수 예문 지원
- JSONB로 문제 데이터 비정규화 (빠른 조회)

---

## 테이블: words

**목적**: 단어 + 예문 저장

```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  sentences TEXT[] NOT NULL,    -- ['예문1', '예문2', '예문3']
  day TEXT NOT NULL              -- 'DAY1', 'DAY2', ...
);
```

**예시**:
```json
{
  "id": "uuid-1",
  "word": "thirst",
  "meaning": "갈증, 목마름; 갈망하다",
  "sentences": [
    "The drink would quench the local population's thirst.",
    "We thirst for retribution."
  ],
  "day": "DAY1"
}
```

**조회 패턴**:
- `WHERE day = 'DAY1'` (DAY 필터)
- `WHERE day IN ('DAY1', 'DAY3')` (복수 DAY)

---

## 테이블: sentence_usage

**목적**: 예문별 출제 이력 추적 (핵심 테이블)

```sql
CREATE TABLE sentence_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES words(id),
  sentence_index INTEGER NOT NULL,   -- sentences 배열의 인덱스 (0-based)
  test_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**예시**:
```json
{
  "word_id": "uuid-1",
  "sentence_index": 0,
  "test_id": "T001",
  "created_at": "2026-04-17T10:00:00Z"
}
```

**조회 패턴** (문제 생성 시):
```sql
-- 단어별로 사용된 예문 횟수 조회
SELECT word_id, sentence_index, COUNT(*) as used_count
FROM sentence_usage
WHERE word_id IN (SELECT id FROM words WHERE day IN ('DAY1', 'DAY2'))
GROUP BY word_id, sentence_index
ORDER BY used_count ASC, created_at ASC;

-- 결과: used_count가 0인 예문 우선, 같으면 created_at 오름차순
```

**기록 타이밍**: 시험 생성 후 각 문제의 예문별로 INSERT

---

## 테이블: students

**목적**: 학생 정보

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,   -- 'S001'
  name TEXT NOT NULL,
  class TEXT NOT NULL                 -- '1-1'
);
```

---

## 테이블: tests

**목적**: 생성된 시험 저장 (문제 전체 비정규화)

```sql
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT UNIQUE NOT NULL,     -- UUID 자동 생성
  days TEXT[] NOT NULL,              -- ['DAY1', 'DAY3']
  mode TEXT NOT NULL,                -- 'day_select' | 'unasked'
  questions JSONB NOT NULL,          -- 전체 문제 배열 저장
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**questions 구조**:
```json
[
  {
    "id": 0,
    "word": "thirst",
    "question": "The drink would quench the local population's _____.",
    "choices": ["thirst", "investment", "precision", "ambiguity", "phenomenon"],
    "answer": 0,           -- 0-based 인덱스
    "sentenceIndex": 0     -- sentences 배열 내 인덱스
  },
  ...
]
```

**조회 패턴**:
- `WHERE test_id = 'T001'` (시험 조회)
- `SELECT questions FROM tests WHERE test_id = 'T001'` (정답 조회, 채점 시)

---

## 테이블: test_results

**목적**: 채점 결과

```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  answers JSONB NOT NULL,           -- [0, 2, 1, 4, 0, ...]
  score INTEGER NOT NULL,           -- 맞은 개수
  wrong_words TEXT[] NOT NULL,      -- ['negotiator', 'ambiguity']
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**예시**:
```json
{
  "student_id": "S001",
  "test_id": "T001",
  "answers": [0, 2, 1, 4, 0, 3, 1, 2, 4, 1],
  "score": 8,
  "wrong_words": ["negotiator", "ambiguity"],
  "created_at": "2026-04-17T11:30:00Z"
}
```

---

## 열거형 (Enum)

### day

```
'DAY1', 'DAY2', 'DAY3', ... 'DAY15'
```

### mode

```
'day_select'   -- DAY 선택 + 문제 수
'unasked'      -- 미출제 예문만
```

---

## 인덱스 (성능)

```sql
-- 문제 생성 시 자주 쿼리하는 칼럼
CREATE INDEX idx_words_day ON words(day);
CREATE INDEX idx_sentence_usage_word_id ON sentence_usage(word_id);

-- 결과 조회
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_test ON test_results(test_id);
```

---

## 초기 데이터 (seed)

`data/words.json`:
```json
[
  {
    "word": "thirst",
    "meaning": "갈증, 목마름; 갈망하다",
    "sentences": [
      "The drink would quench the local population's thirst.",
      "We thirst for retribution."
    ],
    "day": "DAY1"
  },
  ...
]
```

**seed 스크립트** (`scripts/seed.ts`):
1. words.json 읽기
2. words 테이블 INSERT
3. sentence_usage는 공(empty) 상태로 시작 (출제 후 생성)

---

## 설계 결정 이유

| 결정 | 이유 |
|------|------|
| sentence_usage 분리 | 전역 예문 추적 필요. 각 예문의 사용 횟수를 언제든 조회 가능 |
| sentences TEXT[] | 정규화 대비 단순함. 문제 생성 시 배열 인덱스로 직접 접근 |
| questions JSONB | 시험 조회 시 전체 데이터를 한 번에 필요. 스키마 유연성 |
| test_id 분리 저장 | 사용자 친화적 ID (UUID보다 짧게 표시 가능) |
| answers JSONB | 문제 개수가 가변적. 정수 배열로 충분 |
