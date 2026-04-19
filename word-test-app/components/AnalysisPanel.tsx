'use client';

import { useState, useEffect } from 'react';

interface ScoreHistory {
  date: string;
  testId: string;
  score: number;
  total: number;
}

interface WrongWord {
  word: string;
  count: number;
  sentences: string[];
}

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export default function AnalysisPanel({ studentId, studentName, onClose }: Props) {
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWord, setOpenWord] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/students/${studentId}`);
        const data = await res.json();
        setScoreHistory(data.scoreHistory || []);
        setWrongWords(data.wrongWords || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const maxScore = Math.max(...scoreHistory.map(s => s.total), 1);
  const maxCount = Math.max(...wrongWords.map(w => w.count), 1);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
        background: '#fff', zIndex: 50, overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{studentName} 분석</h2>
          <button onClick={onClose} style={{ fontSize: '24px', color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>로딩 중...</div>
        ) : (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* 점수 추이 */}
            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>점수 추이</h3>
              {scoreHistory.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>시험 기록 없음</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scoreHistory.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '80px', fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                        {new Date(s.date).toLocaleDateString('ko-KR')}
                      </span>
                      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(s.score / maxScore) * 100}%`,
                          height: '100%',
                          background: s.score / s.total >= 0.8 ? '#22c55e' : s.score / s.total >= 0.6 ? '#f59e0b' : '#ef4444',
                          borderRadius: '4px',
                          transition: 'width 0.4s',
                        }} />
                      </div>
                      <span style={{ width: '40px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', textAlign: 'right', flexShrink: 0 }}>
                        {s.score}/{s.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 틀린 단어 빈도 */}
            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>자주 틀린 단어</h3>
              {wrongWords.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>틀린 단어 없음 🎉</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {wrongWords.map(w => (
                    <div key={w.word} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        onClick={() => setOpenWord(openWord === w.word ? null : w.word)}
                        style={{
                          width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                        }}
                      >
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '16px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(w.count / maxCount) * 100}%`,
                            height: '100%',
                            background: '#f87171',
                            borderRadius: '4px',
                          }} />
                        </div>
                        <span style={{ fontWeight: 'bold', color: '#1e293b', minWidth: '80px', textAlign: 'left', fontSize: '14px' }}>{w.word}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{w.count}회 {openWord === w.word ? '▲' : '▼'}</span>
                      </button>
                      {openWord === w.word && w.sentences.length > 0 && (
                        <div style={{ padding: '10px 14px', background: '#fafafa', borderTop: '1px solid #e2e8f0' }}>
                          {w.sentences.map((s, i) => (
                            <p key={i} style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '4px 0' }}>
                              • {s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
