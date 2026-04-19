import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testId, studentId, answers } = body;

    if (!testId || !studentId || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    let score = 0;
    const wrongWords: string[] = [];

    (test.questions as { answer: number; word: string }[]).forEach((q, idx) => {
      if (answers[idx] === q.answer) {
        score++;
      } else {
        wrongWords.push(q.word);
      }
    });

    const { error: insertError } = await supabase
      .from('test_results')
      .insert({
        student_id: studentId,
        test_id: testId,
        answers,
        score,
        wrong_words: wrongWords,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      score,
      wrongWords,
      totalCount: test.questions.length,
    });
  } catch (error) {
    console.error('Error grading:', error);
    return NextResponse.json(
      { error: 'Failed to grade' },
      { status: 500 }
    );
  }
}
