'use client';

import { useState, useEffect } from 'react';
import { Test } from '@/lib/types';
import TestPreview from '@/components/TestPreview';
import { useParams, useSearchParams } from 'next/navigation';

export default function TestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.testId as string;
  const showAnswer = searchParams.get('answer') === 'true';

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/test/${testId}`);
        if (!response.ok) throw new Error('시험을 찾을 수 없습니다');
        const data = await response.json();
        setTest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류 발생');
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  if (!test) return <div className="flex items-center justify-center min-h-screen">시험을 찾을 수 없습니다</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            시험 미리보기 ({test.days.join(', ') || '미출제 예문'})
          </h1>
          {showAnswer && (
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">정답 표시 중</span>
          )}
        </div>
        <TestPreview questions={test.questions} testId={testId} showAnswer={showAnswer} />
      </div>
    </div>
  );
}
