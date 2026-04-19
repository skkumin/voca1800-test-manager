# Phase 8: 결과 조회 + 시험 출제 이력 페이지

## 사전 준비

- Phase 7 완성

---

## 작업 내용

### `app/api/results/route.ts`

- `test_results`와 `students` 두 테이블을 별도 조회 후 코드에서 병합
  - Supabase foreign key JOIN(`students!inner`) 사용 불가 — 외래키 미정의 시 `PGRST200` 오류 발생
  - `student_id` 기준으로 `Map`을 만들어 매핑
- 응답에 `student_name`, `student_class` 필드 포함

### `app/results/page.tsx`

- `test_results`를 `student_id` 기준으로 그룹핑 → `StudentSummary[]` 생성
- 상단 콤보박스 검색 (`<input list>` + `<datalist>`): 이름 또는 학교명으로 필터링, 실시간 결과 수 표시
- 학생 카드 그리드 표시 (`auto-fill, minmax(220px, 1fr)`)
- 분석 버튼 클릭 → `<AnalysisPanel>` 오픈

### `components/StudentCard.tsx`

- 이름, 학교, 시험 횟수, 평균 점수 표시
- 평균 정답률에 따라 원형 배지 색상: 80%↑ 초록 / 60%↑ 노랑 / 그 이하 빨강
- 분석 버튼

### `components/AnalysisPanel.tsx` (오른쪽 슬라이드 패널)

- 배경 오버레이 클릭 시 닫기
- **점수 추이**: CSS 가로 바 차트 (점수율에 따라 초록/노랑/빨강)
- **자주 틀린 단어**: 빈도 바 차트 + 클릭 시 예문 아코디언

### `app/api/students/[studentId]/route.ts`

- 해당 학생의 `test_results` 조회 → `scoreHistory` 생성
- 모든 `wrong_words` 빈도 집계 → 빈도순 정렬
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

### 사이드바 메뉴 순서

문제 출제 → 시험 출제 이력 → 채점 → 학생 기록

---

## Acceptance Criteria

```bash
# /results: 이름/반 표시, 학생 필터, 시험지 링크
# /history: 출제 이력 테이블, 시험지 보기 → ?answer=true 정답 표시
```

모두 통과하면 phase 8 status를 `"completed"`로 변경하라.
