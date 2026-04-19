# MVP 구현 계획 (초안)

## 개요

**프로젝트**: 영어 단어 시험 자동 생성 및 채점 웹 서비스 (MVP)
**기간**: 1주 2일 예상
**Phase 수**: 9개

---

## Phase 분해

### Phase 0: 프로젝트 초기화 + Supabase 스키마
**목표**: 
- Next.js 14 프로젝트 생성 (App Router)
- Supabase 프로젝트 생성 + PostgreSQL 스키마 생성
- 환경변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
- seed 스크립트 작성 (초기 단어 데이터 로드)

**산출물**:
- `word-test-app/` Next.js 프로젝트 구조
- Supabase 스키마 (words, students, tests, test_results, sentence_usage)
- `.env.local` 설정 완료
- `scripts/seed.ts` 구현 + 테스트 완료 (seed 실행 후 Supabase 데이터 확인)

**AC**:
```bash
npm run dev  # 로컬 서버 정상 시작 (localhost:3000)
npm run seed # Supabase에 초기 단어 데이터 로드 완료
```

---

### Phase 1: 문제 생성 핵심 로직
**목표**: 
- `lib/generateQuestions.ts` 구현
- 미출제 예문 우선 선택 로직 구현
- blank 처리 정규식 구현
- 오답 선택 로직 구현 (다른 DAY만)

**산출물**:
- `lib/generateQuestions.ts` (모든 헬퍼 함수 포함)
- `lib/types.ts` (TypeScript 타입 정의)

**핵심 함수**:
```typescript
export async function generateQuestions(
  mode: 'day_select' | 'unasked',
  days: string[],
  count: number
): Promise<{ questions: Question[], testId: string }>

async function chooseSentence(word: Word): Promise<WordWithSentence>
async function selectRandomFromOtherDays(word: Word, allWords: Word[], count: number): Promise<Word[]>
function generateChoices(question, allWords): Question
```

**AC**:
```bash
npm test -- lib/generateQuestions  # 생성된 함수 테스트 (또는 manual 테스트)
# DAY1에서 10문제 생성 → 예문이 서로 다른지 확인
# 같은 DAY 2회 생성 → 예문 중복 없음 확인
```

**의존성**: Phase 0 완료

---

### Phase 2: 시험 생성 API
**목표**:
- `app/api/test/generate/route.ts` 구현
- `app/api/test/[testId]/route.ts` 구현
- tests 테이블에 문제 저장
- sentence_usage 테이블에 출제 이력 기록

**산출물**:
- `app/api/test/generate/route.ts` (POST)
- `app/api/test/[testId]/route.ts` (GET)

**API 명세**:

```
POST /api/test/generate
body: { mode: 'day_select' | 'unasked', days: string[], count: number }
response: { testId: string, questions: Question[] }

GET /api/test/{testId}
response: { testId: string, days: string[], mode: string, questions: Question[] }
```

**AC**:
```bash
curl -X POST http://localhost:3000/api/test/generate \
  -H "Content-Type: application/json" \
  -d '{"mode": "day_select", "days": ["DAY1"], "count": 10}' \
  # 성공 (200) + testId 반환

curl http://localhost:3000/api/test/{testId}  # 문제 조회 성공
```

**의존성**: Phase 1 완료

---

### Phase 3: 홈 화면 UI (출제 모드 선택)
**목표**:
- `app/page.tsx` 구현
- 출제 모드 선택 (DAY 선택 / 미출제 예문)
- DAY 체크박스 (동적으로 DB에서 조회)
- 문제 수 입력
- [시험 생성] 버튼 → POST /api/test/generate → /test/[testId] redirect

**산출물**:
- `app/page.tsx`
- `components/ModeSelector.tsx` (라디오 버튼)
- `components/DayCheckboxes.tsx` (DAY 목록)

**UI 구성**:
```
┌─────────────────────┐
│  시험 생성           │
├─────────────────────┤
│ ○ DAY 선택           │
│   [✓] DAY1           │
│   [ ] DAY2           │
│   [ ] DAY3           │
│                      │
│ ○ 미출제 예문만      │
│                      │
│ 문제 수: [____10__]  │
│ [생성하기]           │
└─────────────────────┘
```

**AC**:
```bash
npm run dev  # 로컬 서버 시작
# 브라우저에서 http://localhost:3000 접속
# 1. DAY1 선택, 문제수 10 입력 → 생성 → /test/[testId] 이동 확인
```

**의존성**: Phase 2 완료

---

### Phase 4: 시험 미리보기 페이지
**목표**:
- `app/test/[testId]/page.tsx` 구현
- 문제 목록 렌더링 (번호 + 예문 + 보기)
- PDF 다운로드 버튼 추가 (아직 동작 안 함 - Phase 5에서)

**산출물**:
- `app/test/[testId]/page.tsx`
- `components/TestPreview.tsx` (문제 목록)

**화면**:
```
┌──────────────────────────────────┐
│ 시험 미리보기 (DAY1)               │
├──────────────────────────────────┤
│ [PDF 다운로드]                    │
│                                   │
│ 1번. The drink would quench      │
│      the local population's ___. │
│  ① thirst  ② investment          │
│  ③ precision ④ ambiguity         │
│  ⑤ phenomenon                    │
│                                   │
│ 2번. ...                         │
└──────────────────────────────────┘
```

**AC**:
```bash
npm run dev
# /test/[testId] 접속 → 10문제 모두 표시 확인
# 정답이 숨겨져 있는지 확인 (API는 정답 포함하지만 UI에선 감춤)
```

**의존성**: Phase 3 완료

---

### Phase 5: PDF 생성 (@react-pdf/renderer)
**목표**:
- `components/TestPDF.tsx` 구현
- react-pdf Document 렌더링
- 레이아웃: 이름/반 작성칸 → 문제 목록
- PDFDownloadLink 버튼 연동

**산출물**:
- `components/TestPDF.tsx`
- `package.json` 의존성 추가: `@react-pdf/renderer`

**PDF 구조**:
```
┌─────────────────────────────────┐
│  영어 단어 시험                    │
│  이름: ________________           │
│  반: __________                   │
├─────────────────────────────────┤
│ 1. The drink would quench...     │
│    ① thirst  ② investment        │
│    ③ precision ④ ambiguity       │
│    ⑤ phenomenon                  │
│                                   │
│ 2. ...                           │
└─────────────────────────────────┘
```

**AC**:
```bash
npm run dev
# /test/[testId] 접속 → [PDF 다운로드] 클릭
# test-{testId}.pdf 파일 다운로드 확인
# PDF를 열어 레이아웃 확인 (A4, 한글 정상 표시)
```

**주의사항**:
- 한글 폰트 임베딩 필요 (@react-pdf/renderer는 기본으로 한글 미지원)
- 해결책: Google Fonts 또는 로컬 폰트 파일 사용

**의존성**: Phase 4 완료

---

### Phase 6: 채점 UI (교사 입력 폼)
**목표**:
- `app/grade/page.tsx` 구현
- 학생 선택 드롭다운 (DB에서 조회)
- test_id 입력 또는 최근 시험 목록 표시
- 문제별 ①②③④⑤ 버튼
- [제출] 버튼

**산출물**:
- `app/grade/page.tsx`
- `components/GradeForm.tsx`

**UI**:
```
┌────────────────────────────────┐
│ 채점                             │
├────────────────────────────────┤
│ 학생: [홍길동 ▼]               │
│ 시험: [T001 ▼]                 │
│                                 │
│ 1번  [① ② ③ ④ ⑤]             │
│ 2번  [① ② ③ ④ ⑤]             │
│ ...                             │
│ [제출]                          │
└────────────────────────────────┘
```

**AC**:
```bash
npm run dev
# /grade 접속 → 학생 선택, 시험 선택, 답 입력 가능 확인
# [제출] 버튼 클릭 가능 확인 (아직 동작 안 함 - Phase 7에서)
```

**의존성**: Phase 4 완료

---

### Phase 7: 채점 로직 + 결과 저장
**목표**:
- `app/api/grade/route.ts` (POST) 구현
- 정답과 비교해서 score 계산
- wrong_words 추출
- test_results 테이블에 저장
- 채점 UI에서 결과 표시

**산출물**:
- `app/api/grade/route.ts`
- GradeForm 업데이트 (결과 표시 로직)

**API**:
```
POST /api/grade
body: { testId: string, studentId: string, answers: number[] }
response: { score: number, wrongWords: string[], totalCount: number }
```

**AC**:
```bash
npm run dev
# /grade에서 답 입력 → [제출] → 점수 + 틀린 단어 표시 확인
# Supabase test_results 테이블에 데이터 저장 확인
```

**의존성**: Phase 6 완료

---

### Phase 8: 결과 조회 페이지
**목표**:
- `app/results/page.tsx` 구현
- `app/api/results/route.ts` (GET) 구현
- 모든 채점 기록 조회 (테이블)
- 학생별 / 시험별 필터링 (선택사항)

**산출물**:
- `app/results/page.tsx`
- `app/api/results/route.ts`
- `components/ResultsTable.tsx`

**테이블**:
```
| 학생 | 점수 | 시험ID | 틀린 단어 | 채점 시간 |
|------|------|--------|---------|---------|
| 홍길동 | 8/10 | T001 | negotiator, ambiguity | 2026-04-17 |
```

**AC**:
```bash
npm run dev
# /results 접속 → 모든 채점 기록 테이블 표시 확인
# 여러 학생의 여러 기록이 정상 표시되는지 확인
```

**의존성**: Phase 7 완료

---

### Phase 9: Vercel 배포
**목표**:
- Vercel 프로젝트 생성
- GitHub 연동
- 환경변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
- 배포 + E2E 테스트

**산출물**:
- Vercel에 배포된 라이브 URL
- E2E 테스트 완료 (홈 → 생성 → PDF → 채점 → 결과)

**AC**:
```bash
# Vercel URL에서
# 1. 시험 생성 가능 확인
# 2. PDF 다운로드 가능 확인
# 3. 채점 입력 가능 확인
# 4. 결과 조회 가능 확인
```

**의존성**: Phase 8 완료

---

## 의존성 그래프

```
Phase 0 (프로젝트 초기화)
  ↓
Phase 1 (생성 로직)
  ↓
Phase 2 (생성 API)
  ↓
Phase 3 (홈 화면) ←─┐
Phase 4 (미리보기)  ├─ 병렬 가능
Phase 6 (채점 UI)  ←┘
  ↓
Phase 5 (PDF) ─┐
Phase 7 (채점 API) ├─ 병렬 가능
  ↓
Phase 8 (결과 조회)
  ↓
Phase 9 (배포)
```

---

## 논의점 (구현 전 확인 필요)

1. **초기 데이터 (seed.ts)**: 
   - 어떤 단어 데이터를 loload할 건가? 예시 10개만? 실제 단어 100개?
   - 현재 `data/words.json`이 있나?

2. **한글 폰트**:
   - react-pdf에서 한글을 렌더링하려면 폰트 파일 필요
   - Noto Sans CJK 등 웹폰트 사용?
   - 아니면 로컬 .ttf 파일 임베딩?

3. **학생 초기 데이터**:
   - students 테이블을 어떻게 채울 건가?
   - CSV import는 MVP에 포함? (Phase 10으로 미루기?)

4. **테스트 전략**:
   - Unit test? E2E test?
   - MVP에선 manual 테스트만? (배포 후 Vercel에서 직접 테스트)

5. **에러 처리**:
   - API 에러 응답 포맷 정의?
   - 프론트엔드 에러 화면?

---

## 예상 일정

| Phase | 예상 시간 |
|-------|----------|
| 0 | 3시간 (Next.js 초기화 + Supabase 스키마) |
| 1 | 4시간 (로직 구현 + 테스트) |
| 2 | 3시간 (API 라우트) |
| 3 | 2시간 (홈 UI) |
| 4 | 1시간 (미리보기) |
| 5 | 4시간 (PDF - 한글 폰트 설정 포함) |
| 6 | 3시간 (채점 UI) |
| 7 | 3시간 (채점 로직) |
| 8 | 2시간 (결과 조회) |
| 9 | 1시간 (배포) |
| **총계** | **26시간 (~3.25일, 1주 2일 예상)** |

