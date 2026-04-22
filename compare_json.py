import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

with open("words.json", encoding="utf-8") as f:
    words = json.load(f)
with open("words_normalized.json", encoding="utf-8") as f:
    new_words = json.load(f)

# words_normalized.json을 (day, lemma) 키로 인덱싱
def get_new_word(entry):
    return entry["lemma"]

new_index = {(n["day"], get_new_word(n)): n for n in new_words}

print("=" * 70)
print("words.json vs words_normalized.json 비교 (day+lemma 키 기준)")
print("=" * 70)
print(f"words.json 총 항목: {len(words)}")
print(f"words_normalized.json 총 항목: {len(new_words)}")
print()

missing_in_new = []   # words에는 있지만 words_normalized에 없는 단어
sentence_mismatches = []
exact_matches = 0

for w in words:
    day = w["day"]
    word = w.get("word", "")
    key = (day, word)

    if key not in new_index:
        missing_in_new.append((day, word))
        continue

    n = new_index[key]
    w_sentences = w.get("sentences", [])
    n_sentences = [ex.get("sentence", "") for ex in n.get("examples", [])]

    errors = []
    if len(w_sentences) != len(n_sentences):
        errors.append(f"  예문 수: words={len(w_sentences)} vs words_normalized={len(n_sentences)}")
    else:
        for j, (ws, ns) in enumerate(zip(w_sentences, n_sentences)):
            if ws != ns:
                errors.append(f"  예문{j+1} words  : '{ws}'")
                errors.append(f"  예문{j+1} words_normalized: '{ns}'")

    if errors:
        sentence_mismatches.append((day, word, errors))
    else:
        exact_matches += 1

# words_normalized에만 있고 words에 없는 단어
words_keys = {(w["day"], w.get("word", "")) for w in words}
missing_in_words = [(n["day"], get_new_word(n)) for n in new_words
                    if (n["day"], get_new_word(n)) not in words_keys]

# 결과 출력
if missing_in_new:
    print(f"[words_normalized.json에 없는 단어] {len(missing_in_new)}개:")
    for day, word in missing_in_new:
        print(f"  {day} / '{word}'")
    print()

if missing_in_words:
    print(f"[words.json에 없는 단어] {len(missing_in_words)}개:")
    for day, word in missing_in_words:
        print(f"  {day} / '{word}'")
    print()

if sentence_mismatches:
    print(f"[예문 불일치] {len(sentence_mismatches)}개:")
    for day, word, errors in sentence_mismatches:
        print(f"  {day} / '{word}'")
        for e in errors:
            print(f"    {e}")
    print()

print("=" * 70)
total = len(words)
print(f"완전 일치: {exact_matches}/{total} | "
      f"누락: {len(missing_in_new)} | 예문 불일치: {len(sentence_mismatches)}")

if exact_matches == total and not missing_in_new and not sentence_mismatches:
    print("모든 항목 완전 일치!")
