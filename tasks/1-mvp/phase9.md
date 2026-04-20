# Phase 9: Vercel 배포

## 사전 준비

- Phase 8 완성 (모든 기능 구현)

---

## 작업 내용

### 1. GitHub에 배포 준비

```bash
cd word-test-app
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/{your-username}/word-test-app.git
git push -u origin main
```

### 2. Vercel에 배포

```bash
npm i -g vercel
vercel login
vercel
```

또는 Vercel 웹사이트 (vercel.com):
1. GitHub 계정으로 로그인
2. "New Project" → 위 GitHub 레포지토리 선택
3. 환경변수 설정

### 3. 환경변수 설정 (Vercel 대시보드)

Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = xxxxx
```

### 4. 배포 확인

Vercel에서 자동으로 배포 시작. 완료되면 URL 제공:
```
https://word-test-app.vercel.app
```

---

## E2E 테스트 (배포 후)

Vercel URL에서:

1. **홈 화면** (`/`)
   - DAY 검색 dropdown → 선택 → 시험 생성

2. **시험지** (`/test/[testId]?answer=true`)
   - 정답 표시 확인
   - [시험지 다운로드] → 정답 없는 PDF

3. **채점** (`/grade`)
   - 학생 선택, 시험 ID 입력 → 답 입력 → 제출

4. **학생 기록** (`/results`)
   - 학생 카드 그리드, 평균 점수 100점 환산

5. **분석 패널**
   - 자주 틀린 단어 + 틀린 예문 하이라이트

6. **학생 관리** (`/students`)
   - 학생 추가/삭제 확인

---

## Acceptance Criteria

```bash
# 모든 단계가 배포 URL에서 작동해야 함:
# 1. https://word-test-app.vercel.app/ (홈 화면)
# 2. https://word-test-app.vercel.app/test/{testId} (미리보기)
# 3. https://word-test-app.vercel.app/grade (채점)
# 4. https://word-test-app.vercel.app/results (결과)

# 각 페이지에서 모든 기능 정상 동작 확인
```

## AC 검증

1. Vercel URL 접속
2. 전체 워크플로우 E2E 테스트:
   - 홈 → 시험 생성 → PDF → 채점 → 결과
3. 한글 정상 표시 확인
4. 에러 없음 확인

모두 통과하면 phase 9 status를 `"completed"`로 변경하고 `/tasks/index.json`의 task status를 `"completed"`로 변경하라.

## 주의사항

- Vercel 환경변수는 `.env.local`과 분리 (배포된 서버 환경 필요)
- 초기 배포는 5~10분 소요
- 콘솔 에러는 Vercel 대시보드 Logs에서 확인
