'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/lib/types';
import GradeForm from '@/components/GradeForm';

interface TestHistory {
  testId: string;
  mode: 'day_select' | 'unasked';
  days: string[];
  createdAt: string;
}

export default function GradePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [studentInput, setStudentInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentError, setStudentError] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: studentData }, { data: historyData }] = await Promise.all([
        supabase.from('students').select('*').order('student_id'),
        supabase.from('tests').select('test_id, mode, days, created_at').order('created_at', { ascending: false }),
      ]);

      if (studentData) setStudents(studentData as Student[]);
      if (historyData) {
        setTestHistory(historyData.map(t => ({
          testId: t.test_id,
          mode: t.mode,
          days: t.days,
          createdAt: t.created_at,
        })));
      }
      setLoading(false);
    })();
  }, []);

  const handleStudentInput = (value: string) => {
    setStudentInput(value);
    setStudentError('');
    const match = students.find(s => s.name === value);
    setSelectedStudentId(match ? match.student_id : '');
  };

  const handleStudentBlur = () => {
    if (studentInput && !selectedStudentId) {
      setStudentError('목록에 없는 학생입니다');
    }
  };

  const testLabel = (t: TestHistory) => {
    const date = new Date(t.createdAt).toLocaleDateString('ko-KR');
    const desc = t.mode === 'day_select' ? t.days.join(', ') : '미출제 예문';
    return `${t.testId} (${date} · ${desc})`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">채점</h1>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">시험 ID</label>
          <input
            type="text"
            value={testId}
            onChange={e => setTestId(e.target.value)}
            placeholder="시험 ID 입력 또는 선택"
            list="test-list"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="test-list">
            {testHistory.map(t => (
              <option key={t.testId} value={t.testId}>{testLabel(t)}</option>
            ))}
          </datalist>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">학생 선택</label>
          <input
            type="text"
            value={studentInput}
            onChange={e => handleStudentInput(e.target.value)}
            onBlur={handleStudentBlur}
            placeholder="이름 입력 또는 선택"
            list="student-list"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="student-list">
            {students.map(s => (
              <option key={s.student_id} value={s.name}>{s.name} ({s.class})</option>
            ))}
          </datalist>
          {studentError && (
            <p className="mt-1 text-sm text-red-600">{studentError}</p>
          )}
        </div>

        {selectedStudentId && testId && (
          <GradeForm studentId={selectedStudentId} testId={testId} />
        )}
      </div>
    </div>
  );
}
