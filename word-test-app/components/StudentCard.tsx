'use client';

import { BarChart2 } from 'lucide-react';

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
  const bgColor = pct >= 80 ? '#f0fdf4' : pct >= 60 ? '#fffbeb' : '#fef2f2';

  return (
    <div
      style={{
        background: '#fff', borderRadius: '12px', padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: '14px',
        transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{name}</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>{school}</p>
        </div>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: bgColor, border: `2.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color }}>{pct}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{testCount}</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>시험 횟수</p>
        </div>
        <div>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {avgTotal > 0 ? `${Math.round((avgScore / avgTotal) * 100)}점` : '-'}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>평균 점수</p>
        </div>
      </div>

      <button
        onClick={onAnalyze}
        style={{
          width: '100%', padding: '9px', borderRadius: '8px',
          background: '#6366f1', color: '#fff', border: 'none',
          cursor: 'pointer', fontWeight: '600', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          transition: 'background 0.15s, transform 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; }}
        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <BarChart2 size={15} />
        분석
      </button>
    </div>
  );
}
