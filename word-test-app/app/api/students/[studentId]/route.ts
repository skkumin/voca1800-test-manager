import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    const [{ data: results, error: rErr }, { data: words, error: wErr }] = await Promise.all([
      supabase
        .from('test_results')
        .select('score, answers, wrong_words, created_at, test_id')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true }),
      supabase.from('words').select('word, sentences'),
    ]);

    if (rErr) throw rErr;
    if (wErr) throw wErr;

    const wordSentenceMap = new Map(
      (words || []).map(w => [w.word, w.sentences as string[]])
    );

    const scoreHistory = (results || []).map(r => ({
      date: r.created_at,
      testId: r.test_id,
      score: r.score,
      total: (r.answers as number[]).length,
    }));

    const freqMap = new Map<string, number>();
    for (const r of results || []) {
      for (const w of r.wrong_words as string[]) {
        freqMap.set(w, (freqMap.get(w) || 0) + 1);
      }
    }

    const wrongWords = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({
        word,
        count,
        sentences: wordSentenceMap.get(word) || [],
      }));

    return NextResponse.json({ scoreHistory, wrongWords });
  } catch (error) {
    console.error('Error fetching student analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}
