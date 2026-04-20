# 배포 후 개선 사항

## DB 스키마 마이그레이션

### 1️⃣ `test_results.sentence_ids` 컬럼 추가 (완료)

실제 틀린 예문만 필터링하기 위해 추가됨. 이미 적용됨:

```sql
ALTER TABLE test_results 
ADD COLUMN sentence_ids BIGINT[] DEFAULT '{}';
```

**효과**: 
- 채점 시 틀린 문제의 `sentenceIndex` 기록
- 학생 분석 패널에서 정확한 틀린 예문만 표시

---

### 2️⃣ `students.class` → `students.school` 컬럼 이름 변경 (완료)

현재 `students` 테이블의 `class` 컬럼은 실제로 학교명을 저장하고 있음.
MVP에서는 화면 라벨만 "학교"로 표시하고 컬럼명은 그대로 유지.
배포 후 아래 마이그레이션 필요:

```sql
ALTER TABLE students RENAME COLUMN class TO school;
```

변경 시 수정이 필요한 코드:
- `lib/types.ts` — `Student.class` → `Student.school`
- `app/grade/page.tsx` — `s.class` → `s.school`
- `components/ResultsTable.tsx` — `student_class` → `student_school`
- `app/api/results/route.ts` — `students.class` 매핑 → `students.school`
- `scripts/seed.ts` — seed 데이터 컬럼명 변경
