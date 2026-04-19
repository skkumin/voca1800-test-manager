# Phase 0: 프로젝트 초기화 + Supabase 스키마

## 사전 준비

먼저 아래 문서들을 반드시 읽고 프로젝트의 전체 설계와 기술 스택을 완전히 이해하라:

- `docs/PRD.md` (기능 요구사항)
- `docs/DATA-SCHEMA.md` (DB 스키마)
- `docs/CODE-ARCHITECTURE.md` (코드 구조)
- `docs/ADR.md` (기술 결정사항)

이전 phase: 없음 (첫 단계)

---

## 작업 내용

### 1. Next.js 14 프로젝트 생성

```bash
cd c:/Users/mingue/Desktop/단어\ 자동\ 출제\&채점
npx create-next-app@latest word-test-app --typescript --tailwind --app
cd word-test-app
```

선택사항:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- src/ directory: No

### 2. Supabase 클라이언트 설정

```bash
npm install @supabase/supabase-js
```

`lib/supabase.ts` 생성:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

`.env.local` 파일 생성 (Supabase에서 받은 값으로 채우기):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### 3. Supabase 데이터베이스 스키마 생성

Supabase 대시보시 → SQL Editor에서 아래 SQL 실행:

```sql
-- 단어 테이블
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  sentences TEXT[] NOT NULL,
  day TEXT NOT NULL
);

-- 예문 출제 이력 테이블
CREATE TABLE sentence_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES words(id),
  sentence_index INTEGER NOT NULL,
  test_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 학생 테이블
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL
);

-- 시험 테이블
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT UNIQUE NOT NULL,
  days TEXT[] NOT NULL,
  mode TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채점 결과 테이블
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  wrong_words TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_words_day ON words(day);
CREATE INDEX idx_sentence_usage_word_id ON sentence_usage(word_id);
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_test ON test_results(test_id);
```

### 4. 초기 데이터 (seed.ts) 작성

`scripts/seed.ts` 생성:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const sampleWords = [
  {
    word: "thirst",
    meaning: "갈증, 목마름; 갈망하다",
    sentences: [
      "The drink would quench the local population's thirst.",
      "We thirst for retribution."
    ],
    day: "DAY1"
  },
  {
    word: "negotiator",
    meaning: "협상가, 중재자",
    sentences: [
      "The experienced negotiator resolved the dispute quickly.",
      "As a skilled negotiator, she won favorable terms."
    ],
    day: "DAY1"
  },
  {
    word: "ambiguity",
    meaning: "모호성, 애매함",
    sentences: [
      "The contract contained an ambiguity that led to disputes.",
      "We must eliminate ambiguity in our communication."
    ],
    day: "DAY1"
  },
  {
    word: "phenomenon",
    meaning: "현상, 놀라운 일",
    sentences: [
      "Climate change is a complex phenomenon.",
      "The northern lights are a natural phenomenon."
    ],
    day: "DAY1"
  },
  {
    word: "precision",
    meaning: "정확성, 정밀함",
    sentences: [
      "Surgery requires great precision.",
      "The instrument measures with high precision."
    ],
    day: "DAY2"
  },
  {
    word: "diligent",
    meaning: "근면한, 성실한",
    sentences: [
      "Her diligent work ethic impressed everyone.",
      "A diligent student always completes assignments on time."
    ],
    day: "DAY2"
  },
  {
    word: "eloquent",
    meaning: "웅변의, 말 잘하는",
    sentences: [
      "The eloquent speaker captivated the audience.",
      "His eloquent speech moved people to tears."
    ],
    day: "DAY2"
  },
  {
    word: "resilient",
    meaning: "탄력있는, 회복력있는",
    sentences: [
      "The resilient community rebuilt after the disaster.",
      "Rubber is a resilient material."
    ],
    day: "DAY3"
  },
  {
    word: "meticulous",
    meaning: "세밀한, 꼼꼼한",
    sentences: [
      "His meticulous attention to detail was impressive.",
      "The meticulous artist painted every brushstroke carefully."
    ],
    day: "DAY3"
  },
  {
    word: "pragmatic",
    meaning: "실용적인, 현실적인",
    sentences: [
      "We need a pragmatic approach to solve this problem.",
      "The pragmatic solution was more cost-effective."
    ],
    day: "DAY3"
  }
];

const sampleStudents = [
  { student_id: "S001", name: "홍길동", class: "1-1" },
  { student_id: "S002", name: "김철수", class: "1-1" },
  { student_id: "S003", name: "이영희", class: "1-2" },
  { student_id: "S004", name: "박민지", class: "1-2" },
  { student_id: "S005", name: "정준호", class: "1-3" }
];

async function seed() {
  try {
    console.log("🌱 Seeding words...");
    const { error: wordError } = await supabase
      .from("words")
      .insert(sampleWords);
    if (wordError) throw wordError;
    console.log(`✓ Inserted ${sampleWords.length} words`);

    console.log("🌱 Seeding students...");
    const { error: studentError } = await supabase
      .from("students")
      .insert(sampleStudents);
    if (studentError) throw studentError;
    console.log(`✓ Inserted ${sampleStudents.length} students`);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
```

`package.json`에 script 추가:
```json
{
  "scripts": {
    "seed": "tsx scripts/seed.ts"
  }
}
```

### 5. Seed 스크립트 실행

```bash
npm install tsx
npm run seed
```

Supabase 대시보드에서 `words`, `students` 테이블에 데이터가 로드되었는지 확인.

### 6. 타입 정의 (lib/types.ts)

```typescript
export interface Word {
  id: string;
  word: string;
  meaning: string;
  sentences: string[];
  day: string;
}

export interface Question {
  id: number;
  word: string;
  question: string;
  choices: string[];
  answer: number;
  sentenceIndex: number;
}

export interface Test {
  testId: string;
  days: string[];
  mode: 'day_select' | 'unasked';
  questions: Question[];
  createdAt: string;
}

export interface TestResult {
  studentId: string;
  testId: string;
  answers: number[];
  score: number;
  wrongWords: string[];
  createdAt: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
}
```

---

## Acceptance Criteria

```bash
# 로컬 서버 시작
npm run dev
# → http://localhost:3000 접속 가능 (404 페이지 보임 - OK)

# Seed 실행
npm run seed
# → ✅ Seed completed successfully! 메시지 출력

# Supabase 대시보드에서 확인
# - words 테이블: 10개 단어
# - students 테이블: 5명 학생
```

## AC 검증 방법

1. `npm run dev` 실행 → 로컬 서버 정상 시작 확인
2. `npm run seed` 실행 → 성공 메시지 확인
3. Supabase 대시보드 → Tables 메뉴:
   - words: 10행
   - students: 5행
   - tests, test_results, sentence_usage: 비어있음 (정상)

모두 확인되면 `/tasks/1-mvp/index.json`의 phase 0 status를 `"completed"`로 변경하라.

## 주의사항

- `.env.local` 파일은 Git에 커밋하면 안 됨 (`.gitignore` 확인)
- Supabase API 키는 민감한 정보이므로 노출 금지
- seed 스크립트는 멱등성 보장 안 함 (두 번 실행하면 중복 데이터). 처음 한 번만 실행하고, 재실행 필요 시 Supabase 대시보드에서 데이터 삭제 후 실행.
