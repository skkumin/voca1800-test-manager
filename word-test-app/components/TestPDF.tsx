import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Question } from '@/lib/types';

interface Props {
  questions: Question[];
}

Font.register({
  family: 'Noto Sans KR',
  src: `${typeof window !== 'undefined' ? window.location.origin : ''}/fonts/NotoSansKR-Regular.woff`,
  format: 'woff',
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#f9fafb',
    padding: '32px 40px',
    fontFamily: 'Noto Sans KR',
    fontSize: 11,
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  headerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  headerLine: {
    width: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: '14px 16px',
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  questionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choice: {
    width: '50%',
    fontSize: 10,
    color: '#475569',
    paddingVertical: 3,
    lineHeight: 1.4,
  },
});

export default function TestPDF({ questions }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>영어 단어 시험</Text>
          <View style={styles.headerInfo}>
            <View style={styles.headerInfoItem}>
              <Text style={styles.headerLabel}>이름</Text>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.headerInfoItem}>
              <Text style={styles.headerLabel}>반</Text>
              <View style={styles.headerLine} />
            </View>
          </View>
        </View>

        {questions.map((q, idx) => (
          <View key={idx} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {idx + 1}번.  {q.question}
            </Text>
            <View style={styles.choicesGrid}>
              {q.choices.map((choice, cidx) => (
                <Text key={cidx} style={styles.choice}>
                  {cidx + 1}. {choice}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
