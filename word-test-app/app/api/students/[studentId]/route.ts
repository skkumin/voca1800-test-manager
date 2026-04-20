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
        .select('score, answers, wrong_words, sentence_ids, created_at, test_id')
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

    const wrongWordsMap = new Map<string, { count: number; sentenceIndices: Set<number> }>();
    for (const r of results || []) {
      const wrongWordsArr = r.wrong_words as string[];
      const sentenceIdsArr = r.sentence_ids as number[];
      for (let i = 0; i < wrongWordsArr.length; i++) {
        const word = wrongWordsArr[i];
        const sentenceIdx = sentenceIdsArr?.[i];
        const current = wrongWordsMap.get(word) || { count: 0, sentenceIndices: new Set<number>() };
        current.count += 1;
        if (sentenceIdx !== undefined && sentenceIdx !== null) {
          current.sentenceIndices.add(sentenceIdx);
        }
        wrongWordsMap.set(word, current);
      }
    }

    const wrongWords = Array.from(wrongWordsMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([word, { count, sentenceIndices }]) => ({
        word,
        count,
        sentences: (wordSentenceMap.get(word) || []).filter((_, idx) => sentenceIndices.size === 0 || sentenceIndices.has(idx)),
      }));

    return NextResponse.json({ scoreHistory, wrongWords });
  } catch (error) {
    console.error('Error fetching student analysis:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('student_id', studentId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
