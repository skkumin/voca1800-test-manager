'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Question } from '@/lib/types';

interface Props {
  questions: Question[];
  testId: string;
  showAnswer?: boolean;
}

export default function TestPreview({ questions, testId, showAnswer = false }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownload = async () => {
    setPdfLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: TestPDF } = await import('./TestPDF');
      const { createElement } = await import('react');
      const blob = await pdf(createElement(TestPDF, { questions, showAnswer: false }) as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-${testId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleDownload}
            disabled={pdfLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#2563eb', color: '#fff',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.6 : 1,
              fontWeight: '600', fontSize: '14px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!pdfLoading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2563eb'; }}
          >
            {pdfLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
            {pdfLoading ? 'PDF 생성 중...' : '시험지 다운로드'}
          </button>
        </div>
        <span className="text-sm text-gray-400">시험 ID: {testId}</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 rounded-r-lg bg-gray-50 hover:bg-blue-50 transition-colors">
            <h3 className="font-semibold text-gray-800 mb-3">
              {idx + 1}번. {q.question}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {q.choices.map((choice, cidx) => {
                const isAnswer = showAnswer && cidx === q.answer;
                return (
                  <div
                    key={cidx}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      color: isAnswer ? '#16a34a' : '#374151',
                      fontWeight: isAnswer ? 'bold' : 'normal',
                      padding: '2px 0',
                    }}
                  >
                    <span style={{ position: 'relative' }}>
                      {String.fromCharCode(9312 + cidx)}
                      {isAnswer && (
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                      )}
                    </span>
                    <span>{choice}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
