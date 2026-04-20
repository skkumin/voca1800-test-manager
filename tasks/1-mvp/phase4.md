# Phase 4: 시험지 페이지

## 사전 준비

- `docs/CODE-ARCHITECTURE.md`
- Phase 2, 3 완성

---

## 작업 내용

### `app/test/[testId]/page.tsx`

- 헤더: "시험 미리보기" → "시험지"
- `useParams()`로 testId 추출
- `useSearchParams()`로 `?answer=true` 여부 확인
- `showAnswer` prop을 `<TestPreview>`에 전달
- `?answer=true` 시 "정답 표시 중" 배지 표시

### `components/TestPreview.tsx`

- `showAnswer?: boolean` prop 추가
- `showAnswer && cidx === q.answer` 조건으로 정답 선택지에 초록 ✓ 배지 + 초록 텍스트 표시 (화면)
- **시험지 다운로드** 버튼: 문제+선택지만 (정답 미포함) PDF로 다운로드
  - PDF 생성시 항상 정답 미포함으로 처리 (`showAnswer: false` 강제)
  - 화면상 정답 표시와 별도 처리

### `app/history/page.tsx` (시험 출제 이력)

- "시험지 보기" 버튼: `<Link>` → styled `<a>` (인라인 스타일, 새 탭 X)
- 같은 브라우저 탭에서 `/test/[testId]?answer=true` 로 이동

### 정답 표시 라우팅 규칙

| URL | 용도 | 정답 표시 |
|-----|------|-----------|
| `/test/[testId]` | 일반 미리보기 / 채점 후 이동 | ❌ |
| `/test/[testId]?answer=true` | 시험 출제 이력에서 교사 확인용 | ✅ (화면) / ❌ (PDF) |

---

## Acceptance Criteria

```bash
npm run dev
# /test/[testId] 접속
# 1. 문제 목록 표시
# 2. [PDF 다운로드] 버튼 표시
# /test/[testId]?answer=true 접속
# 3. 정답 선택지에 초록 ✓ 표시
# 4. "정답 표시 중" 배지 표시
```

모두 통과하면 phase 4 status를 `"completed"`로 변경하라.
