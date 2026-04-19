import Link from 'next/link';

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

interface Props {
  results: DbResult[];
}

export default function ResultsTable({ results }: Props) {
  if (results.length === 0) {
    return <div className="text-gray-500 text-center py-8">채점 기록이 없습니다</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">이름</th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">학교</th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">점수</th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">시험지</th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">틀린 단어</th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">채점 날짜</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">{result.student_name}</td>
              <td className="border border-gray-200 px-4 py-3 text-gray-600">{result.student_class}</td>
              <td className="border border-gray-200 px-4 py-3 font-semibold text-indigo-600">
                {result.score}/{result.answers.length}
              </td>
              <td className="border border-gray-200 px-4 py-3">
                <Link
                  href={`/test/${result.test_id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  시험지 보기
                </Link>
              </td>
              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                {result.wrong_words.length > 0 ? result.wrong_words.join(', ') : '없음'}
              </td>
              <td className="border border-gray-200 px-4 py-3 text-sm text-gray-500">
                {new Date(result.created_at).toLocaleDateString('ko-KR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
