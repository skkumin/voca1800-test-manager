'use client';

import { useState, useEffect } from 'react';
import StudentCard from '@/components/StudentCard';
import AnalysisPanel from '@/components/AnalysisPanel';

interface DbResult {
  student_id: string;
  student_name: string;
  student_class: string;
  test_id: string;
  answers: number[];
  score: number;
  wrong_words: string[];
  created_at: string;
}

interface StudentSummary {
  studentId: string;
  name: string;
  school: string;
  testCount: number;
  avgScore: number;
  avgTotal: number;
}

export default function ResultsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeStudent, setActiveStudent] = useState<{ id: string; name: string } | null>(null);

  const filtered = searchInput
    ? students.filter(s => s.name.includes(searchInput) || s.school.includes(searchInput))
    : students;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/results');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const results: DbResult[] = data.results || [];

        const map = new Map<string, StudentSummary>();
        for (const r of results) {
          if (!map.has(r.student_id)) {
            map.set(r.student_id, {
              studentId: r.student_id,
              name: r.student_name,
              school: r.student_class,
              testCount: 0,
              avgScore: 0,
              avgTotal: 0,
            });
          }
          const s = map.get(r.student_id)!;
          s.testCount += 1;
          s.avgScore += r.score;
          s.avgTotal += r.answers.length;
        }

        setStudents(Array.from(map.values()).map(s => ({
          ...s,
          avgScore: s.testCount > 0 ? s.avgScore / s.testCount : 0,
          avgTotal: s.testCount > 0 ? s.avgTotal / s.testCount : 0,
        })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">학생 기록</h1>

        <div className="mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="이름 또는 학교 검색"
            list="student-search-list"
            className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="student-search-list">
            {students.map(s => (
              <option key={s.studentId} value={s.name}>{s.name} ({s.school})</option>
            ))}
          </datalist>
          {searchInput && (
            <span className="ml-3 text-sm text-gray-400">{filtered.length}명</span>
          )}
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">채점 기록이 없습니다</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {filtered.map(s => (
              <StudentCard
                key={s.studentId}
                studentId={s.studentId}
                name={s.name}
                school={s.school}
                testCount={s.testCount}
                avgScore={s.avgScore}
                avgTotal={s.avgTotal}
                onAnalyze={() => setActiveStudent({ id: s.studentId, name: s.name })}
              />
            ))}
          </div>
        )}
      </div>

      {activeStudent && (
        <AnalysisPanel
          studentId={activeStudent.id}
          studentName={activeStudent.name}
          onClose={() => setActiveStudent(null)}
        />
      )}
    </div>
  );
}
