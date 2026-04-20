'use client';

import { useState, useEffect } from 'react';

interface HistoryRow {
  testId: string;
  mode: 'day_select' | 'unasked';
  days: string[];
  questionCount: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setRows(data.results || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">시험 출제 이력</h1>

        {rows.length === 0 ? (
          <div className="text-gray-500 text-center py-8">출제 이력이 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">출제일</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">모드</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">DAY</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">문제 수</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">시험지</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.testId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                      {new Date(row.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm">
                      {row.mode === 'day_select' ? 'DAY 선택' : '미출제 예문'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                      {row.mode === 'day_select' ? row.days.join(', ') : '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-center">
                      {row.questionCount}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <a
                        href={`/test/${row.testId}?answer=true`}
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '5px 12px', borderRadius: '6px',
                          background: '#6366f1', color: '#fff',
                          fontSize: '13px', fontWeight: '600',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        시험지 보기
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
