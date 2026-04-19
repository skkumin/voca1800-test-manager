'use client';

import { useState, useEffect } from 'react';
import { Test } from '@/lib/types';

interface Props {
  studentId: string;
  testId: string;
}

export default function GradeForm({ studentId, testId }: Props) {
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    (async () => {
      try {
        const response = await fetch(`/api/test/${testId}`);
        if (!response.ok) throw new Error('시험을 찾을 수 없습니다');
        const data = await response.json();
        setTest(data);
        setAnswers(new Array(data.questions.length).fill(null));
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류 발생');
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  const handleAnswerChange = (questionIdx: number, choiceIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIdx] = choiceIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === null)) {
      alert('모든 문제에 답해주세요');
      return;
    }

    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, studentId, answers }),
      });

      if (!response.ok) throw new Error('채점 실패');

      const result = await response.json();
      alert(`채점 완료!\n점수: ${result.score}/${result.totalCount}\n틀린 단어: ${result.wrongWords.join(', ') || '없음'}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류 발생');
    }
  };

  if (loading) return <div className="py-4 text-gray-500">시험 로딩 중...</div>;
  if (error) return <div className="py-4 text-red-600">{error}</div>;
  if (!test) return null;

  const answeredCount = answers.filter(a => a !== null).length;

  return (
    <div>
      <div className="mb-3 text-sm text-gray-500">{answeredCount} / {test.questions.length} 완료</div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {test.questions.map((_, idx) => (
          <div
            key={idx}
            className={`flex items-center px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            <span className="w-12 text-sm font-bold text-gray-700 shrink-0">{idx + 1}번</span>
            <div style={{ width: '1px', background: '#e2e8f0', margin: '0 12px', alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => handleAnswerChange(idx, n - 1)}
                  style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', background: answers[idx] === n - 1 ? '#f0fdf4' : '#f3f4f6', color: answers[idx] === n - 1 ? '#16a34a' : '#4b5563', transition: 'all 0.15s' }}
                >
                  {String.fromCharCode(9311 + n)}
                  {answers[idx] === n - 1 && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-4px', fontSize: '11px', color: '#16a34a', fontWeight: 'bold', lineHeight: 1 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full mt-6 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
      >
        제출 ({answeredCount}/{test.questions.length})
      </button>
    </div>
  );
}
