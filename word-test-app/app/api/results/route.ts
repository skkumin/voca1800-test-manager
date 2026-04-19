import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const [{ data: results, error: resultsError }, { data: students, error: studentsError }] = await Promise.all([
      supabase.from('test_results').select('*').order('created_at', { ascending: false }),
      supabase.from('students').select('student_id, name, class'),
    ]);

    if (resultsError) throw resultsError;
    if (studentsError) throw studentsError;

    const studentMap = new Map((students || []).map(s => [s.student_id, s]));

    const merged = (results || []).map(row => {
      const student = studentMap.get(row.student_id);
      return {
        ...row,
        student_name: student?.name ?? row.student_id,
        student_class: student?.class ?? '-',
      };
    });

    return NextResponse.json({ results: merged });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
