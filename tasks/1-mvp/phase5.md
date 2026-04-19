# Phase 5: PDF 생성 (@react-pdf/renderer)

## 사전 준비

- Phase 4 완성
- `docs/PRD.md` (PDF 요구사항)

---

## 작업 내용

### 1. 패키지 설치

```bash
npm install @react-pdf/renderer
npm install @fontsource/noto-sans-kr
```

### 2. 폰트 파일 준비

`@fontsource/noto-sans-kr`에서 한국어 서브셋 WOFF를 `public/fonts/`에 복사:

```bash
cp node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff public/fonts/NotoSansKR-Regular.woff
```

### 3. PDF 컴포넌트 작성

`components/TestPDF.tsx`:
- `Font.register`로 로컬 WOFF 폰트 등록 (`window.location.origin + '/fonts/NotoSansKR-Regular.woff'`)
- 웹 미리보기와 동일한 레이아웃: 회색 배경 + 흰색 카드 + 파란 왼쪽 테두리
- 선택지는 `String.fromCharCode(9312 + cidx)` 대신 `{cidx + 1}.` 사용 (원 숫자는 서브셋 폰트에 없음)

### 4. PDF 다운로드 방식

`PDFDownloadLink` 컴포넌트는 React 19와 충돌. 대신 버튼 onClick에서 `pdf().toBlob()` 직접 호출:

```typescript
const handleDownload = async () => {
  const { pdf } = await import('@react-pdf/renderer');
  const { default: TestPDF } = await import('./TestPDF');
  const { createElement } = await import('react');
  const blob = await pdf(createElement(TestPDF, { questions })).toBlob();
  // blob → URL → <a> 다운로드
};
```

---

## Acceptance Criteria

```bash
npm run dev
# http://localhost:3000 → 시험 생성 → /test/[testId]
# [PDF 다운로드] 클릭
# → test-{testId}.pdf 파일 다운로드

# PDF를 Adobe Reader 또는 Chrome에서 열기
# 1. 제목 "영어 단어 시험" 한글 정상 표시
# 2. 문제 전체 표시
# 3. 이름/반 작성 공간 있음
# 4. 웹 미리보기와 동일한 카드 레이아웃
```

## AC 검증 방법

1. `npm run dev` 실행
2. 시험 생성
3. [PDF 다운로드] 클릭
4. 다운로드된 PDF 파일 열기
5. 한글 정상 표시, 레이아웃 정상 확인

모두 통과하면 phase 5 status를 `"completed"`로 변경하라.

## 주의사항

- `PDFDownloadLink`는 React 19와 호환 안 됨 → `pdf().toBlob()` 방식 사용
- 원 숫자(①②③) 깨짐 → 한국어 서브셋 WOFF에 해당 글리프 없음, `1.` `2.` 형식으로 대체
- 폰트는 CDN 대신 로컬 `/public/fonts/` 서빙 (CDN 404/403 문제 있음)
