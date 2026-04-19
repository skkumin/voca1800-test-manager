# Phase 6: 채점 UI (교사 입력 폼)

## 사전 준비

- Phase 4 완성
- `docs/FLOW.md` (채점 흐름)

---

## 작업 내용

### `app/grade/page.tsx`

- **순서**: 시험 ID 입력 → 학생 선택
- **시험 ID**: `<input list="test-list">` + `<datalist>` 콤보박스
  - `tests` 테이블에서 출제 이력 조회
  - 드롭다운 표시 형식: `T1776... (2026. 4. 19. · DAY1, DAY2)`
- **학생 선택**: `<input list="student-list">` + `<datalist>` 콤보박스
  - 이름 타이핑 시 자동완성 드롭다운 표시
  - `students.find(s => s.name === value)`로 `student_id` 매핑
  - 목록에 없는 이름 입력 후 포커스 아웃 시 에러 메시지 표시
- `selectedStudentId && testId` 조건 충족 시 `<GradeForm>` 렌더링

### `components/GradeForm.tsx`

**레이아웃**: 문제 텍스트 없이 번호와 선택지만 한 줄 표시

```
1번 | ① ② ③ ④ ⑤
2번 | ① ② ③ ④ ⑤
```

- 문제 번호와 선택지 사이: 1px 세로 구분선 (CSS border)
- 홀짝 줄 배경색 교차 (white / gray-50)
- 상단에 진행 상황 표시: `N / 전체 완료`

**선택지 버튼**:
- 미선택: 회색 배경 + ①②③④⑤ 텍스트
- 선택됨: 연초록 배경 + ①②③④⑤ 유지 + 오른쪽 상단에 초록 ✓ 배지 (absolute 위치)
- `String.fromCharCode(9312 + cidx)` 로 원 숫자 생성

**제출 버튼**: `제출 (N/전체)` 형식으로 진행 상황 표시, `/api/grade` POST 호출

---

## Acceptance Criteria

```bash
npm run dev
# /grade 접속
# 1. 학생 드롭다운 선택 가능
# 2. 시험 ID 입력 시 문제 목록 로드
# 3. 1번 | ① ② ③ ④ ⑤ 한 줄 형식으로 표시
# 4. 선택 시 연초록 배경 + ✓ 배지 표시
# 5. [제출 (N/전체)] 버튼 표시
```

## AC 검증

브라우저에서:
1. /grade 접속
2. 학생 선택 + 시험 ID 입력
3. 선택지 클릭 → ✓ 표시 확인
4. 제출 버튼 진행 상황 업데이트 확인

모두 통과하면 phase 6 status를 `"completed"`로 변경하라.
