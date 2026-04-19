'use client';

interface Props {
  studentId: string;
  name: string;
  school: string;
  testCount: number;
  avgScore: number;
  avgTotal: number;
  onAnalyze: () => void;
}

export default function StudentCard({ name, school, testCount, avgScore, avgTotal, onAnalyze }: Props) {
  const pct = avgTotal > 0 ? Math.round((avgScore / avgTotal) * 100) : 0;
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{name}</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>{school}</p>
        </div>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color }}>{pct}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{testCount}</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>시험 횟수</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {avgTotal > 0 ? `${avgScore.toFixed(1)}/${avgTotal}` : '-'}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>평균 점수</p>
        </div>
      </div>

      <button
        onClick={onAnalyze}
        style={{
          width: '100%', padding: '8px', borderRadius: '8px',
          background: '#6366f1', color: '#fff', border: 'none',
          cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
        }}
      >
        분석
      </button>
    </div>
  );
}
