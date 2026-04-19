# ADR: 기술적 결정사항 (Architecture Decision Records)

## ADR-001: 예문 출제 이력 추적을 별도 테이블로 관리

**상태**: 채택

**컨텍스트**: 
같은 DAY를 여러 번 출제할 때 예문이 중복되지 않아야 한다.
예를 들어 DAY1을 처음 출제하면 thirst의 예문 1번을 사용하고,
DAY1을 재출제하면 같은 단어의 예문 2번을 사용해야 한다.
이를 추적하려면 **전역 상태**가 필요하다.

**결정**:
`sentence_usage` 테이블을 별도로 생성하여,
각 문제 생성 시 어느 예문을 사용했는지 기록한다.
(`word_id`, `sentence_index`, `test_id`)

**대안 검토**:

| 방식 | 장점 | 단점 | 선택 |
|------|-----|------|------|
| sentence_usage 테이블 | 명확함, 조회 유연 | JOIN 필요 | ✅ 선택 |
| words.used_sentences JSON | 단순함 | 스키마 변경 불가, UPDATE 복잡 | ❌ |
| Redis 캐시 | 빠름 | 배포 환경 의존, 동기화 복잡 | ❌ |

**근거**:
- MVP는 성능보다 **명확한 로직**을 우선
- 예문 추적은 비즈니스 핵심 요구사항
- 테이블 분리로 INDEX와 쿼리 최적화 용이

**영향**:
- generateQuestions() 시 sentence_usage 조회 추가
- DB 조회 1회 증가 (무시할 수 있는 수준)

---

## ADR-002: 복수 DAY 동시 선택 지원

**상태**: 채택

**컨텍스트**:
초기 요구사항은 "1개 DAY 선택"이었으나,
사용자가 "DAY1+DAY2+DAY3 섞어서 출제하고 싶다"는 요구가 발생.

**결정**:
- `tests.days` 칼럼을 TEXT[] 배열로 저장
- 홈 화면에서 체크박스로 복수 선택 가능
- 오답은 **선택된 DAY 외**의 단어에서만 선택

**예**:
```
사용자가 DAY1, DAY3 선택
→ 시험 문제는 DAY1+DAY3 단어로만 구성
→ 오답은 DAY2, DAY4, ... 단어에서만 선택
```

**영향**:
- 프론트엔드: 체크박스 추가 (UI 2시간)
- 백엔드: `WHERE day IN (...)` 쿼리 변경
- DB: TEXT[] 네이티브 지원 (PostgreSQL)

---

## ADR-003: PDF 생성을 클라이언트 사이드 (react-pdf)로 구현

**상태**: 채택

**컨텍스트**:
Puppeteer는 serverless 환경(Vercel)에서:
- Cold start 느림 (5초+)
- 용량 크다 (50MB+ 함수 패키지)
- 인프라 복잡도 증가

반면 클라이언트 PDF는:
- 즉시 렌더링
- 배포 환경 무관
- 학생별 다른 이름 쉽게 처리 가능

**결정**:
`@react-pdf/renderer` 사용
→ React 컴포넌트를 PDF로 변환 (클라이언트)

**대안 검토**:

| 방식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| react-pdf | 가볍고 빠름 | 복잡한 레이아웃은 한계 | ✅ 선택 |
| jsPDF + html2canvas | 이미지 포함 쉬움 | 더 무거움 | △ 대안 |
| Puppeteer (BE) | 정확한 레이아웃 | Vercel 적합성 낮음 | ❌ |

**근거**:
- MVP 범위에선 "깔끔한 인쇄" 수준이면 충분
- 특수 레이아웃 필요 시 → jsPDF 전환 가능
- **배포 환경 자유도**가 높음

**영향**:
- components/TestPDF.tsx 구현
- 폰트 임베딩 처리 필요 (한글)
- 예상 번들 크기 +100KB

---

## ADR-004: 문제 데이터 비정규화 (JSONB questions 저장)

**상태**: 채택

**컨텍스트**:
시험 생성 후, 채점 시에 **정확히 같은 문제 데이터가 필요**.
각 문제의 정답, 선택지가 변경되면 안 된다.

만약 문제가 `question_id` 참조 형태면:
- word 데이터 변경 → 채점 결과 검증 불가
- 복잡한 데이터 모델

**결정**:
시험 생성 시점에 **전체 문제를 JSONB로 비정규화**하여 저장
→ 채점 시 이 데이터를 정답 기준으로 사용

**구조**:
```json
tests.questions = [
  {
    "id": 0,
    "word": "thirst",
    "question": "The drink would quench the local population's _____.",
    "choices": ["thirst", "investment", "precision", "ambiguity", "phenomenon"],
    "answer": 0,
    "sentenceIndex": 0
  }
]
```

**대안 검토**:

| 방식 | 장점 | 단점 | 선택 |
|------|------|------|------|
| JSONB 비정규화 | 채점 시 일치성 보장 | 업데이트 불가 | ✅ 선택 |
| question_id 참조 | 정규화 | 데이터 변경 시 채점 검증 복잡 | ❌ |

**근거**:
- 시험은 **생성 시점의 스냅샷**
- 출제자는 나중에 "이 시험을 다시 수정"할 필요 없음
- JSONB는 조회/분석 용이

**영향**:
- tests 테이블 행 당 크기 증가 (1KB~)
- DB 스토리지 증가 경미 (1년 1000회 출제 = ~1GB)
- 조회 성능 우수 (JOIN 불필요)

---

## ADR-005: 채점을 교사 수동 입력 방식 (OMR 자동화 제외)

**상태**: 채택

**컨텍스트**:
OMR 자동 스캔을 요구할 수도 있지만,
초기 요구사항은 "교사가 손으로 입력하는 간단한 방식"

OMR 추가 기능:
- OpenCV 구축 복잡
- 스캔 이미지 품질 의존
- 정확도 검증 어려움
- MVP 범위 초과

**결정**:
웹 UI에서 학생별로 ①②③④⑤ 버튼 클릭 입력
→ 교사가 시험지 보며 클릭

**근거**:
- 교사는 어차피 수기로 채점 중
- "웹에서 재입력"은 2분 이내 (10문제 기준)
- OMR은 향후 추가 가능 (기술 트리)

**향후 확장**:
- OMR 모듈 추가
- 이미지 업로드 → 자동 인식
- 기존 데이터 모델 호환 (answers 배열은 동일)

---

## ADR-006: 학생 관리 최소화 (로그인 없음)

**상태**: 채택

**컨텍스트**:
MVP 범위에서는 "교사가 학생 이름을 수동으로 선택"하면 충분.
로그인 시스템 추가 시:
- Auth0/Firebase 통합 (+1일)
- 학생 DB 유지보수
- 세션 관리

**결정**:
- 학생 DB 유지 (CSV import는 추후)
- 채점 시 드롭다운에서 선택
- 인증 X

**근거**:
- 소규모 학원/학교 환경 = 동시 사용자 적음
- 보안 요구사항 낮음 (민감한 정보 없음)
- 실제 운영: 교사가 PC 1대 사용

**추후 확장**:
```
MVP → 학원용 → 기관 로그인 + 학생 계정 추가
```

---

## ADR-007: 데이터베이스로 Supabase PostgreSQL 선택

**상태**: 채택

**컨텍스트**:
선택지:
1. **Supabase** (PostgreSQL + Auth + Real-time)
2. **Firebase** (NoSQL + Auth + 빠른 시작)
3. **MongoDB** (자유로운 스키마)

요구사항:
- 정규화된 데이터 (words, sentence_usage, tests)
- SQL JOIN 필요 (예문 추적)
- 복잡한 쿼리 불가피

**결정**:
**Supabase** 선택

**근거**:

| 항목 | Supabase | Firebase | MongoDB |
|------|----------|----------|---------|
| 정규화 | ✅ 네이티브 | ❌ NoSQL | △ 수동 |
| SQL JOIN | ✅ | ❌ 클라이언트 | △ $lookup |
| 예문 추적 쿼리 | ✅ 간단 | ❌ 복잡 | △ 복잡 |
| 무료 플랜 | 500MB + 50K 행 | 1GB | ❌ |
| 배포 연동 | Vercel과 통합 | ✅ | △ |

**특히 ADR-004의 JSONB 비정규화 + ADR-001의 sentence_usage 조인**
→ **PostgreSQL의 강점**

**영향**:
- TypeScript + @supabase/supabase-js 패키지
- Real-time 기능은 사용하지 않음 (추후 가능)

---

## ADR-008: 배포 플랫폼으로 Vercel 선택

**상태**: 채택

**컨텍스트**:
Next.js 선택 → 배포 플랫폼 결정
- Vercel (Next.js 공식)
- AWS/GCP
- 일반 VPS

**결정**:
**Vercel** 선택

**근거**:
- Next.js App Router 네이티브 지원
- 환경변수 + 비밀 키 관리 편함
- 무료 플랜으로도 충분 (API 한도 100만 요청/월)
- Preview 배포 (PR마다 스테이징 URL 자동 생성)
- PostgreSQL(Supabase)과 연동 간편

**영향**:
- vercel.json 최소 설정
- 환경변수는 Vercel 대시보드에서 관리
- Git push → 자동 배포

---

## ADR-009: blank 처리 시 정규식 - 단어 경계 기준, 대소문자 무시

**상태**: 채택

**컨텍스트**:
"thirst"를 blank로 처리할 때:
- "thirsty" 같은 파생형도 blank?
- "Thirst" (첫글자 대문자) 포함?
- "thirst." 문장 끝의 핸들링?

**결정**:
```regex
\b${word}\b     // 단어 경계
/gi             // 대소문자 무시 + 전역
```

예:
```
"The drink would quench the local population's thirst."
→ "The drink would quench the local population's _____."

"We THIRST for retribution."  (대소문자 무시)
→ "We _____ for retribution."

"thirsting" (파생형)
→ 그대로 두기 (정확히 일치하는 경우만)
```

**근거**:
- 정규식 `/\b.../gi`는 SQL도 지원 (이식성)
- 파생형(lemmatization)은 MVP 범위 제외
- 교육용 → 정확한 단어 일치가 학습에 더 효과적

**향후 확장**:
```
고급: lemmatization 라이브러리 추가
  "thirst", "thirsting", "thirsty" 모두 인식
```

---

## ADR-010: 오답 선택 시 "다른 DAY" 기준

**상태**: 채택

**컨텍스트**:
시험에 DAY1 단어가 출제되었을 때,
오답은:
- DAY1 내 다른 단어? (같은 DAY)
- DAY2, DAY3, ... 다른 DAY? (다른 DAY)

선택에 따라 난이도/공정성 달라짐.

**결정**:
**다른 DAY 기준** 사용

예:
```
시험: DAY1 + DAY2 선택
정답: thirst (DAY1)
오답: DAY3, DAY4, DAY5 등 단어 4개
```

**근거**:
- DAY1 단어들 간 의미 유사도 높을 가능성
- 다른 DAY 단어는 학습 완료도 낮음 (더 어려운 오답)
- 객관성: "같은 DAY는 생략" 규칙이 명확

**영향**:
- `selectRandomFromOtherDays()` 함수 필요
- 오답 풀이 더 크면 확실함 (DAY 많을 때)
- 오답 풀이 부족 예외: 추후 처리 (에러 발생 또는 DAY 내에서 선택)

---

## 요약 표

| ADR | 결정 | 근거 | 위험도 |
|-----|------|------|--------|
| 001 | sentence_usage 테이블 | 예문 추적 명확화 | 낮음 |
| 002 | 복수 DAY 선택 | 사용자 요구 | 낮음 |
| 003 | react-pdf (클라이언트) | Vercel 배포 간편성 | 낮음 |
| 004 | questions JSONB 비정규화 | 데이터 일치성 | 낮음 |
| 005 | OMR 제외 | MVP 범위 | 중간 (향후 추가) |
| 006 | 로그인 제외 | 소규모 환경 | 중간 (향후 추가) |
| 007 | Supabase PostgreSQL | SQL JOIN 필요 | 낮음 |
| 008 | Vercel 배포 | Next.js 연동 | 낮음 |
| 009 | `\b word \b` + /gi | 정확한 일치 | 낮음 |
| 010 | 다른 DAY 오답 | 난이도 관리 | 낮음 |
