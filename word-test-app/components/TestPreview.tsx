'use client';

import { useState } from 'react';
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

      const blob = await pdf(createElement(TestPDF, { questions })).toBlob();
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
      <div className="mb-6">
        <button
          onClick={handleDownload}
          disabled={pdfLoading}
          style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: pdfLoading ? 0.5 : 1 }}
        >
          {pdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
        <span className="ml-3 text-sm text-gray-400">시험 ID: {testId}</span>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-800">
              {idx + 1}번. {q.question}
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {q.choices.map((choice, cidx) => {
                const isAnswer = showAnswer && cidx === q.answer;
                return (
                  <div
                    key={cidx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isAnswer ? '#16a34a' : '#374151',
                      fontWeight: isAnswer ? 'bold' : 'normal',
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
    </div>
  );
}
