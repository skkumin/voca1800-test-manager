'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Student {
  student_id: string;
  name: string;
  school: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [schoolInput, setSchoolInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        setStudents(data.students || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async () => {
    setError('');
    if (!nameInput.trim() || !schoolInput.trim()) {
      setError('이름과 학교를 모두 입력하세요');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), school: schoolInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudents(prev => [...prev, data.student]);
      setNameInput('');
      setSchoolInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가 실패');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm('이 학생을 삭제하시겠습니까? 채점 기록은 유지됩니다.')) return;
    setDeletingId(studentId);
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setStudents(prev => prev.filter(s => s.student_id !== studentId));
    } catch {
      alert('삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">학생 관리</h1>

        {/* 추가 폼 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>학생 추가</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input
              type="text"
              placeholder="학생 이름"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
            <input
              type="text"
              placeholder="학교"
              value={schoolInput}
              onChange={e => setSchoolInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: '8px', cursor: adding ? 'not-allowed' : 'pointer',
                fontWeight: '600', fontSize: '14px', opacity: adding ? 0.6 : 1, whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} />
              {adding ? '추가 중...' : '추가'}
            </button>
          </div>
          {error && <p style={{ marginTop: '8px', fontSize: '13px', color: '#ef4444' }}>{error}</p>}
        </div>

        {/* 학생 목록 */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>이름</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>학교</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    등록된 학생이 없습니다
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr
                    key={s.student_id}
                    style={{ borderBottom: idx < students.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>{s.school}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(s.student_id)}
                        disabled={deletingId === s.student_id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px', borderRadius: '6px',
                          border: '1px solid #fecaca', background: '#fff', cursor: 'pointer',
                          color: '#ef4444', opacity: deletingId === s.student_id ? 0.4 : 1,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {students.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8' }}>
              총 {students.length}명
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
