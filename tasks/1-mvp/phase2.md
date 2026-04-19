# Phase 2: 시험 생성 API

## 사전 준비

관련 문서:
- `docs/CODE-ARCHITECTURE.md` (API 엔드포인트 명세)
- `docs/FLOW.md` (API 흐름)

이전 phase 산출물:
- Phase 1: `lib/generateQuestions.ts` 완성

---

## 작업 내용

### 1. 시험 생성 API (POST /api/test/generate)

`app/api/test/generate/route.ts` 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/generateQuestions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, days, count } = body;

    // 입력 검증
    if (!mode || !days || !count) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, days, count' },
        { status: 400 }
      );
    }

    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: 'days must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof count !== 'number' || count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'count must be between 1 and 50' },
        { status: 400 }
      );
    }

    const result = await generateQuestions(mode, days, count);

    return NextResponse.json({
      testId: result.testId,
      questions: result.questions
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
```

### 2. 시험 조회 API (GET /api/test/[testId])

`app/api/test/[testId]/route.ts` 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    if (!testId) {
      return NextResponse.json(
        { error: 'testId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('test_id', testId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      testId: data.test_id,
      days: data.days,
      mode: data.mode,
      questions: data.questions,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    );
  }
}
```

---

## Acceptance Criteria

```bash
# 로컬 서버 시작
npm run dev

# 터미널에서 API 테스트
curl -X POST http://localhost:3000/api/test/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "day_select",
    "days": ["DAY1"],
    "count": 5
  }'

# 응답:
# {
#   "testId": "T1234567890",
#   "questions": [...]
# }

# 반환된 testId로 조회
curl http://localhost:3000/api/test/T1234567890
# 200 OK + 문제 데이터

# Supabase에서 확인
# - tests 테이블에 1개 행 생성
# - sentence_usage 테이블에 5개 행 생성
```

## AC 검증 방법

1. `npm run dev` 실행
2. POST /api/test/generate 호출 → testId 반환 확인
3. GET /api/test/{testId} 호출 → 문제 데이터 반환 확인
4. Supabase 대시보드에서 tests, sentence_usage 데이터 확인

모두 통과하면 phase 2 status를 `"completed"`로 변경하라.

## 주의사항

- 입력 검증 필수 (mode, days, count)
- 에러 응답은 명확한 메시지 포함
- Supabase 에러는 클라이언트에 노출 금지
