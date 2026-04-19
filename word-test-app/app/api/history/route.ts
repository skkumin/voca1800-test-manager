import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('test_id, mode, days, questions, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const results = (data || []).map(row => ({
      testId: row.test_id,
      mode: row.mode,
      days: row.days,
      questionCount: (row.questions as unknown[]).length,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
