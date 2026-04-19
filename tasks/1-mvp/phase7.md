# Phase 7: 채점 로직 + 결과 저장

## 사전 준비

- Phase 6 완성
- `docs/CODE-ARCHITECTURE.md` (채점 API)

---

## 작업 내용

`app/api/grade/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testId, studentId, answers } = body;

    // 입력 검증
    if (!testId || !studentId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 시험 조회
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('questions')
      .eq('test_id', testId)
      .single();

    if (testError || !test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // 정답과 비교
    let score = 0;
    const wrongWords: string[] = [];

    (test.questions as any[]).forEach((q, idx) => {
      if (answers[idx] === q.answer) {
        score++;
      } else {
        wrongWords.push(q.word);
      }
    });

    // 결과 저장
    const { error: insertError } = await supabase
      .from('test_results')
      .insert({
        student_id: studentId,
        test_id: testId,
        answers,
        score,
        wrong_words: wrongWords
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      score,
      wrongWords,
      totalCount: test.questions.length
    });
  } catch (error) {
    console.error('Error grading:', error);
    return NextResponse.json(
      { error: 'Failed to grade' },
      { status: 500 }
    );
  }
}
```

---

## Acceptance Criteria

```bash
npm run dev

# 채점 API 테스트
curl -X POST http://localhost:3000/api/grade \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "T1234567890",
    "studentId": "S001",
    "answers": [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]
  }'

# 응답:
# {
#   "score": <점수>,
#   "wrongWords": [...],
#   "totalCount": 10
# }

# Supabase 확인:
# - test_results 테이블에 1개 행 추가됨
```

## AC 검증

1. `/grade`에서 답 입력 → [제출] → 알림 창에 점수 + 틀린 단어 표시
2. Supabase test_results 테이블에서 데이터 확인

모두 통과하면 phase 7 status를 `"completed"`로 변경하라.

## 주의사항

- 정답 인덱스 비교는 0-based여야 함
- 틀린 단어는 word 필드에서 추출
