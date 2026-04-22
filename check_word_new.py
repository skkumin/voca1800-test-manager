import json
from collections import defaultdict

with open("words_normalized.json", encoding="utf-8") as f:
    data = json.load(f)

day_words = defaultdict(list)
for entry in data:
    day_key = f"DAY {entry['day']:02d}"
    day_words[day_key].append(entry)

print("=" * 60)
print("DAY별 단어 수 & 예문 수 검사")
print("=" * 60)

word_count_errors = []
example_errors = []

for day in sorted(day_words.keys()):
    words = day_words[day]
    word_count = len(words)
    bad_examples = [w["lemma"] for w in words if len(w.get("examples", [])) != 2]

    status_word = "OK" if word_count == 30 else f"ERROR (단어 {word_count}개)"
    status_ex = "OK" if not bad_examples else f"ERROR {bad_examples}"

    print(f"{day} | 단어:{word_count:3d} [{status_word}] | 예문: [{status_ex}]")

    if word_count != 30:
        word_count_errors.append((day, word_count))
    if bad_examples:
        example_errors.append((day, bad_examples))

print("=" * 60)
print(f"총 DAY 수: {len(day_words)}")
print(f"총 단어 수: {len(data)}")
print()

if not word_count_errors and not example_errors:
    print("모든 DAY 정상: 단어 30개, 예문 2개씩 확인 완료!")
else:
    if word_count_errors:
        print(f"[단어 수 오류] {len(word_count_errors)}개 DAY:")
        for day, cnt in word_count_errors:
            print(f"  {day}: {cnt}개")
    if example_errors:
        print(f"[예문 수 오류] {len(example_errors)}개 DAY:")
        for day, words in example_errors:
            print(f"  {day}: {words}")
