# CODE-ARCHITECTURE: 코드 구조

## 레이아웃

```
word-test-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # 홈 (출제 모드 선택)
│   ├── test/
│   │   └── [testId]/
│   │       └── page.tsx          # 시험 미리보기
│   ├── grade/
│   │   └── page.tsx              # 채점 UI
│   ├── results/
│   │   └── page.tsx              # 결과 조회
│   ├── admin/
│   │   └── page.tsx              # 학생 관리 (추후)
│   └── api/
│       ├── test/
│       │   ├── generate/
│       │   │   └── route.ts      # POST 시험 생성
│       │   └── [testId]/
│       │       └── route.ts      # GET 시험 조회
│       ├── grade/
│       │   └── route.ts          # POST 채점
│       ├── results/
│       │   └── route.ts          # GET 결과 조회
│       └── students/
│           ├── route.ts          # GET 학생 목록
│           └── import/           # POST CSV import (추후)
├── components/
│   ├── TestPreview.tsx           # 문제 목록 표시
│   ├── TestPDF.tsx               # react-pdf 컴포넌트
│   ├── GradeForm.tsx             # 채점 폼
│   ├── ResultsTable.tsx          # 결과 테이블
│   └── ui/
│       └── (shadcn 컴포넌트)
├── lib/
│   ├── supabase.ts               # Supabase 클라이언트
│   ├── generateQuestions.ts      # 핵심 로직
│   ├── types.ts                  # TypeScript 타입
│   └── utils.ts                  # 헬퍼 함수
├── scripts/
│   └── seed.ts                   # 초기 데이터 로드
├── data/
│   └── words.json
├── .env.local                    # 로컬 환경변수
├── package.json
└── tsconfig.json
```

---

## 핵심 로직 모듈

### lib/generateQuestions.ts

**책임**: 시험 문제 생성 (미출제 예문 선택 포함)

```typescript
export async function generateQuestions(
  mode: 'day_select' | 'unasked',
  days: string[],
  count: number
): Promise<{
  questions: Question[],
  testId: string
}> {
  // 1. 대상 단어 조회
  const targetWords = await getTargetWords(mode, days);
  
  // 2. 선택할 단어 결정 (count개)
  const selectedWords = selectRandomWords(targetWords, count);
  
  // 3. 각 단어별 예문 선택 (미출제 우선)
  const questionsWithSentence = await Promise.all(
    selectedWords.map(word => chooseSentence(word))
  );
  
  // 4. 각 문제별 보기 생성 (정답 + 오답 4개)
  const questions = questionsWithSentence.map(q =>
    generateChoices(q, targetWords)
  );
  
  // 5. sentence_usage 기록
  await recordUsage(questions);
  
  // 6. tests 테이블 저장
  const testId = await saveTest(questions, mode, days);
  
  return { questions, testId };
}
```

**세부 함수**:

#### chooseSentence(word): Promise<WordWithSentence>
```typescript
// 1. sentence_usage 조회: 이 word의 각 예문 사용 횟수
// 2. used_count=0인 예문 필터
// 3. 없으면 used_count 적은 순, created_at 오름차순 정렬
// 4. 상위 3개에서 랜덤 선택 (다양성)
```

**핵심 쿼리**:
```sql
SELECT w.id, w.word, w.meaning, w.sentences, w.day,
       COUNT(su.id) as used_count, MAX(su.created_at) as last_used
FROM words w
LEFT JOIN sentence_usage su ON w.id = su.word_id
WHERE w.id = $1
GROUP BY w.id
ORDER BY used_count ASC, last_used ASC
LIMIT 1
```

#### generateChoices(question, allWords): Question
```typescript
// 1. blank 처리: sentence에서 word를 _____ 로 치환
const questionText = sentence.replace(
  new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi'),
  '_____'
);

// 2. 정답 인덱스 랜덤 결정 (0-4)
const answerIdx = Math.floor(Math.random() * 5);

// 3. 오답 4개: 다른 DAY 단어에서 랜덤 선택 (중복 제외)
const wrongWords = selectRandomFromOtherDays(
  word,
  selectedWords,
  allWords,
  4
);

// 4. 보기 배열 구성 및 섞기
const choices = buildAndShuffleChoices(word, wrongWords, answerIdx);

return { id, word, question: questionText, choices, answer: answerIdx };
```

---

## API 엔드포인트

### POST /api/test/generate

**요청**:
```typescript
{
  mode: 'day_select' | 'unasked',
  days: ['DAY1', 'DAY2'],           // mode='day_select' 시
  count: 10
}
```

**응답**:
```typescript
{
  testId: 'T001-xyz...',
  questions: Question[]
}
```

**로직**:
```typescript
1. 입력 검증
2. generateQuestions() 호출
3. 성공 시 testId 반환
4. 실패 시 에러 메시지
```

---

### GET /api/test/[testId]

**응답**:
```typescript
{
  testId: string,
  days: string[],
  mode: string,
  questions: Question[]  // answer 포함 (서버 로직용)
}
```

**보안 주의**: 클라이언트에서 answer 노출 금지 (PDF 전용)

---

### POST /api/grade

**요청**:
```typescript
{
  testId: string,
  studentId: string,
  answers: number[]    // [0, 2, 1, 4, ...]
}
```

**응답**:
```typescript
{
  score: number,
  wrongWords: string[],
  totalCount: number
}
```

**로직**:
```typescript
1. tests.questions 조회 (정답 배열)
2. 제출한 answers와 비교
3. score 계산
4. 틀린 인덱스 → word 매핑
5. test_results 저장
6. 결과 반환
```

---

## 컴포넌트 계층

### page.tsx (홈)

```typescript
export default function Home() {
  const [mode, setMode] = useState<'day_select' | 'unasked'>('day_select');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    const { testId } = await fetch('/api/test/generate', {
      method: 'POST',
      body: JSON.stringify({ mode, days: selectedDays, count })
    }).then(r => r.json());
    
    router.push(`/test/${testId}`);
  }

  return (
    <div>
      <h1>시험 생성</h1>
      
      {/* 모드 선택 */}
      <RadioGroup value={mode} onValueChange={setMode}>
        <Label><Input type="radio" value="day_select" /> DAY 선택</Label>
        <Label><Input type="radio" value="unasked" /> 미출제 예문</Label>
      </RadioGroup>

      {/* 조건부 렌더링 */}
      {mode === 'day_select' && (
        <DayCheckboxes selected={selectedDays} onChange={setSelectedDays} />
      )}

      {/* 문제 수 */}
      <input type="number" value={count} onChange={e => setCount(+e.target.value)} />

      {/* 생성 버튼 */}
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? '생성 중...' : '시험 생성'}
      </button>
    </div>
  );
}
```

### [testId]/page.tsx (미리보기)

```typescript
export default function TestPage({ params: { testId } }) {
  const [test, setTest] = useState<Test | null>(null);

  useEffect(() => {
    fetch(`/api/test/${testId}`).then(r => r.json()).then(setTest);
  }, [testId]);

  return (
    <div>
      <TestPreview questions={test?.questions || []} />
      <PDFDownloadLink document={<TestPDF test={test!} />} fileName={`test-${testId}.pdf`}>
        {({ loading }) => loading ? 'PDF 생성 중...' : 'PDF 다운로드'}
      </PDFDownloadLink>
    </div>
  );
}
```

### /grade/page.tsx (채점)

```typescript
// 1. 학생 선택 드롭다운
// 2. test_id 또는 최근 시험 목록
// 3. 문제별 버튼 (①②③④⑤)
// 4. POST /api/grade → 결과 표시
```

---

## 타입 정의 (lib/types.ts)

```typescript
interface Word {
  id: string;
  word: string;
  meaning: string;
  sentences: string[];
  day: string;
}

interface Question {
  id: number;
  word: string;
  question: string;      // "The drink would quench the local population's _____."
  choices: string[];     // ["thirst", "investment", ...]
  answer: number;        // 0-4 (0-based)
  sentenceIndex: number; // 사용한 예문 인덱스
}

interface Test {
  testId: string;
  days: string[];
  mode: 'day_select' | 'unasked';
  questions: Question[];
  createdAt: string;
}

interface TestResult {
  studentId: string;
  testId: string;
  answers: number[];
  score: number;
  wrongWords: string[];
  createdAt: string;
}
```

---

## 의존성 주입

**Supabase 클라이언트** (lib/supabase.ts):
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**모든 API 라우트에서 사용**:
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.from('words').select('*');
```

---

## 에러 처리

**Strategy**:
- API: 400/500 HTTP 상태 + 에러 메시지
- 컴포넌트: try-catch + 사용자 친화적 메시지
- DB: 제약 위반 시 명확한 메시지 (예: "단어가 이미 존재합니다")

**예**:
```typescript
try {
  const response = await fetch('/api/test/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('시험 생성 실패');
} catch (err) {
  setError('시험을 생성할 수 없습니다. 잠시 후 다시 시도하세요.');
}
```
