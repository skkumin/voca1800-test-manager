'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'day_select' | 'unasked'>('day_select');
  const [days, setDays] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [allDays, setAllDays] = useState<string[]>([]);
  const [unaskedCount, setUnaskedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('words').select('day');
      if (data) {
        const uniqueDays = Array.from(new Set(data.map((d: { day: string }) => d.day))).sort();
        setAllDays(uniqueDays);
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== 'unasked') return;
    (async () => {
      const [{ data: allWords }, { data: usedWords }] = await Promise.all([
        supabase.from('words').select('id'),
        supabase.from('sentence_usage').select('word_id'),
      ]);
      if (allWords && usedWords) {
        const usedIds = new Set(usedWords.map((u: { word_id: string }) => u.word_id));
        const n = allWords.filter((w: { id: string }) => !usedIds.has(w.id)).length;
        setUnaskedCount(n);
        setCount(Math.min(10, n));
      }
    })();
  }, [mode]);

  const handleGenerateTest = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'day_select' && days.length === 0) {
        setError('최소 1개 이상의 DAY를 선택하세요');
        setLoading(false);
        return;
      }

      let questionCount = count;
      if (mode === 'day_select') {
        const { data } = await supabase.from('words').select('id').in('day', days);
        questionCount = data?.length ?? 0;
        if (questionCount === 0) {
          setError('선택한 DAY에 단어가 없습니다');
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, days: mode === 'day_select' ? days : [], count: questionCount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '시험 생성 실패');
      }

      const { testId } = await response.json();
      router.push(`/test/${testId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">시험 생성</h1>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">출제 모드</label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as 'day_select' | 'unasked')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="day_select">DAY 선택</option>
            <option value="unasked">미출제 예문</option>
          </select>
        </div>

        {mode === 'day_select' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">DAY 선택</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allDays.map(day => (
                <label key={day} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={days.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {mode === 'unasked' && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              총 <span className="font-bold text-indigo-600">{unaskedCount}개</span> 미출제 예문이 있습니다
            </p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">문제 수</label>
            <input
              type="number"
              min="1"
              max={unaskedCount}
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(unaskedCount, parseInt(e.target.value) || 1)))}
              disabled={unaskedCount === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerateTest}
          disabled={loading || (mode === 'unasked' && unaskedCount === 0)}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '생성 중...' : '시험 생성'}
        </button>
      </div>
    </div>
  );
}
