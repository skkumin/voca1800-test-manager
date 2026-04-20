# Phase 8: 결과 조회 + 시험 출제 이력 페이지

## 사전 준비

- Phase 7 완성

---

## 작업 내용

### `app/api/results/route.ts`

- `test_results`와 `students` 두 테이블을 별도 조회 후 코드에서 병합
  - Supabase foreign key JOIN(`students!inner`) 사용 불가 — 외래키 미정의 시 `PGRST200` 오류 발생
  - `student_id` 기준으로 `Map`을 만들어 매핑
- 응답에 `student_name`, `student_school` 필드 포함

### `app/results/page.tsx`

- `test_results`를 `student_id` 기준으로 그룹핑 → `StudentSummary[]` 생성
- 상단 콤보박스 검색 (`<input list>` + `<datalist>`): 이름 또는 학교명으로 필터링, 실시간 결과 수 표시
- 학생 카드 그리드 표시 (`auto-fill, minmax(220px, 1fr)`)
- 분석 버튼 클릭 → `<AnalysisPanel>` 오픈

### `components/StudentCard.tsx`

- 이름, 학교, 시험 횟수, 평균 점수 표시
  - 평균 점수: 100점 환산 (예: `75점`)
  - 원형 배지: 평균 정답률에 따라 색상 (80%↑ 초록 / 60%↑ 노랑 / 그 이하 빨강)
- 분석 버튼

### `components/AnalysisPanel.tsx` (오른쪽 슬라이드 패널)

- 배경 오버레이 클릭 시 닫기
- **자주 틀린 단어**: 빈도 바 차트 + 클릭 시 예문 아코디언
  - 예문은 **채점할 당시 틀린 문제의 예문만** 필터링 표시
  - `sentence_ids` 배열로 인덱싱하여 정확한 문장만 포함
  - 예문 내 틀린 단어 노란색 하이라이트

### `app/api/students/[studentId]/route.ts`

- 해당 학생의 `test_results` 조회 (with `sentence_ids`) → `scoreHistory` 생성
- 모든 `wrong_words` 빈도 집계 → 빈도순 정렬
- **sentence_ids 필터링**: 각 틀린 단어마다
  - 해당 단어가 틀린 모든 시험에서의 `sentence_ids` 수집
  - 단어의 전체 `sentences` 배열에서 해당 인덱스만 필터링
  - 결과: 실제 틀린 예문만 반환
- `words` 테이블에서 각 단어의 예문(`sentences`) 조회

### `app/api/history/route.ts`

- `tests` 테이블에서 `test_id, mode, days, questions, created_at` 조회
- `questionCount` = `questions.length`

### `app/history/page.tsx` (시험 출제 이력)

| 컬럼 | 내용 |
|------|------|
| 출제일 | `created_at` → `ko-KR` |
| 모드 | `day_select` → "DAY 선택" / `unasked` → "미출제 예문" |
| DAY | `days.join(', ')` / 미출제 예문이면 "-" |
| 문제 수 | `questionCount` |
| 시험지 | `/test/[testId]?answer=true` 링크 (교사용 정답 표시) |

### `app/students/page.tsx` (학생 관리)

- 상단 추가 폼: 이름 + 학교 입력 → 추가 버튼 (Enter 키 지원)
- 학생 목록 테이블: 이름 / 학교 / 삭제 버튼
- 삭제 시 확인 다이얼로그 (채점 기록은 유지됨)
- API: `GET /api/students`, `POST /api/students`, `DELETE /api/students/[studentId]`
- 학생 ID는 내부적으로 `S${Date.now()}` 타임스탬프 기반 생성 (화면에 미표시)

### 사이드바 메뉴 순서

문제 출제 → 시험 출제 이력 → 채점 → 학생 기록 → 학생 관리

---

## Acceptance Criteria

```bash
# /results: 이름/반 표시, 학생 필터, 시험지 링크
# /history: 출제 이력 테이블, 시험지 보기 → ?answer=true 정답 표시
```

모두 통과하면 phase 8 status를 `"completed"`로 변경하라.
