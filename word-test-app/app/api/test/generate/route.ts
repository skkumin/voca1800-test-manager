import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/generateQuestions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, days, count } = body;

    // 입력 검증
    if (!mode || count === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, count' },
        { status: 400 }
      );
    }

    if (mode === 'day_select' && (!Array.isArray(days) || days.length === 0)) {
      return NextResponse.json(
        { error: 'days must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof count !== 'number' || count < 1) {
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
