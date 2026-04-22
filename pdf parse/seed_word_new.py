import json
import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / "word-test-app" / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("오류: .env.local에서 Supabase 환경변수를 찾을 수 없습니다.")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

word_new_path = Path(__file__).parent.parent / "words_normalized.json"
with open(word_new_path, encoding="utf-8") as f:
    data = json.load(f)


QUALITY_MAP = {
    "high": "High",
    "low_too_short": "Low (Too Short)",
    "error": "Error: Word not found",
}

def normalize_questions(entry):
    """words_normalized.json의 예문 구조를 DB 저장 형식으로 변환."""
    questions = []
    for ex in entry.get("examples", []):
        if not ex.get("testable", True):
            continue
        blank = ex.get("blank", {})
        questions.append({
            "original":    ex["sentence"],
            "blank_word":  blank.get("surface", ""),
            "inflection":  blank.get("inflection", ""),
            "start":       blank.get("start", 0),
            "end":         blank.get("end", 0),
            "suitability": QUALITY_MAP.get(ex.get("quality", ""), ""),
        })
    return questions


rows = []
for entry in data:
    rows.append({
        "word":              entry["lemma"],
        "day":               f"DAY {entry['day']:02d}",
        "meaning":           entry.get("meaning_ko") or None,
        "questions":         normalize_questions(entry),
        "pos":               entry.get("pos"),
        "inflections":       entry.get("inflections"),
        "semantic_category": entry.get("semantic_category"),
    })

print(f"총 {len(rows)}개 단어 준비")
print(f"  questions 2개: {sum(1 for r in rows if len(r['questions']) == 2)}개")
print(f"  questions 1개: {sum(1 for r in rows if len(r['questions']) == 1)}개")
print(f"  questions 0개: {sum(1 for r in rows if len(r['questions']) == 0)}개")
print()

BATCH = 50
success = 0
HEADERS_UPSERT = {**HEADERS, "Prefer": "resolution=merge-duplicates"}

for i in range(0, len(rows), BATCH):
    batch = rows[i:i + BATCH]
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/words",
        headers=HEADERS_UPSERT,
        json=batch,
    )
    if res.status_code not in (200, 201):
        print(f"오류 발생 (batch {i}~{i+len(batch)}): {res.status_code} {res.text}")
        sys.exit(1)
    success += len(batch)
    print(f"  완료: {success}/{len(rows)}")

print(f"\n완료! words 테이블에 {success}개 삽입.")
