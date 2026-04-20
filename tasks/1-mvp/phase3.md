# Phase 3: 홈 화면 (출제 모드 선택)

## 사전 준비

- `docs/FLOW.md` (홈 화면 흐름)
- Phase 2: 시험 생성 API 완성

---

## 작업 내용

`app/page.tsx` 생성 (홈 화면):

### 레이아웃

1. **출제 모드 드롭다운** (`<select>`)
   - `DAY 선택`: DB에서 DAY 목록 조회 → DAY1~n 체크박스 나열 (선택한 DAY 단어 전부 출제)
   - `미출제 예문`: 미출제 예문 수를 DB에서 조회 → "총 N개 미출제 예문이 있습니다" 안내 + 문제 수 입력 칸 (max = 미출제 수)

2. **DAY 선택 모드**
   - DB words 테이블에서 distinct day 조회
   - 검색 입력칸 + Dropdown 그리드로 DAY 선택
     - 입력칸 클릭 시 dropdown 열림 (검색 필터링)
     - 4열 그리드로 선택된/미선택 DAY 버튼 표시
     - 선택한 DAY는 위에 removable tag로 표시
   - 전체 선택/해제 버튼 제공
   - 문제 수 입력 없음 (선택한 DAY의 단어 전체 출제)

3. **미출제 예문 모드**
   - sentence_usage에 없는 word 수 조회
   - "총 N개 미출제 예문이 있습니다" 텍스트 표시
   - 문제 수 입력 칸 (1 ~ N, 기본값 min(10, N))

---

## Acceptance Criteria

```bash
npm run dev
# http://localhost:3000 접속
# 1. 드롭다운으로 DAY 선택 / 미출제 예문 전환 가능
# 2. DAY 선택: 체크박스로 DAY1~n 선택 가능
# 3. 미출제 예문: 미출제 수 표시 + 문제 수 입력 가능
# 4. [시험 생성] 클릭 → /test/[testId]로 이동
```

## AC 검증 방법

브라우저에서:
1. 홈 화면 로드 확인
2. 드롭다운 전환 시 UI 변경 확인
3. DAY 체크박스 선택 가능 확인
4. 미출제 예문 수 표시 확인
5. [시험 생성] 버튼 클릭 → 시험 미리보기 페이지로 이동 확인

모두 통과하면 phase 3 status를 `"completed"`로 변경하라.

## 레이아웃 (app/layout.tsx)

모든 페이지 공통 사이드바 네비게이션 적용:
- `components/Sidebar.tsx`: 문제 출제 (`/`) / 채점 (`/grade`) / 학생 기록 (`/results`)
- `usePathname()`으로 현재 경로 감지 → 활성 메뉴 파란색 하이라이트
- `app/layout.tsx`에서 `<Sidebar />` + `<main>` 구조로 감싸기

---

## 주의사항

- `미출제 예문` 모드는 `days: []` (빈 배열)를 API에 전송함
- `/api/test/generate` 의 `days` 검증은 `mode === 'day_select'` 일 때만 적용해야 함
  - 잘못된 검증: `!Array.isArray(days) || days.length === 0` (모드 무관)
  - 올바른 검증: `mode === 'day_select' && (!Array.isArray(days) || days.length === 0)`
