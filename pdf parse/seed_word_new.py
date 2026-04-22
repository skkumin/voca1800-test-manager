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

word_new_path = Path(__file__).parent.parent / "word_new.json"
with open(word_new_path, encoding="utf-8") as f:
    data = json.load(f)


def normalize_questions(entry):
    """두 구조를 통일하고 is_testable=false 예문은 제외한다."""
    questions = []
    for q in entry.get("questions", []):
        if "is_testable" in q and not q["is_testable"]:
            continue

        if "blank_info" in q and q["blank_info"] is not None:
            blank_word = q["blank_info"].get("word_in_text", "")
            indices = q["blank_info"].get("indices") or {}
            start = indices.get("start", 0)
            end   = indices.get("end", 0)
        else:
            blank_word = q.get("blank_word", "")
            coords = q.get("coordinates") or {}
            start = coords.get("start", 0)
            end   = coords.get("end", 0)

        questions.append({
            "original":    q["original"],
            "blank_word":  blank_word,
            "start":       start,
            "end":         end,
            "suitability": q.get("suitability", ""),
        })
    return questions


rows = []
for entry in data:
    word = entry.get("target_word") or entry.get("word", "")
    rows.append({
        "word":      word,
        "day":       entry["day"],
        "meaning":   None,
        "questions": normalize_questions(entry),
    })

print(f"총 {len(rows)}개 단어 준비")
print(f"  questions 2개: {sum(1 for r in rows if len(r['questions']) == 2)}개")
print(f"  questions 1개: {sum(1 for r in rows if len(r['questions']) == 1)}개")
print(f"  questions 0개: {sum(1 for r in rows if len(r['questions']) == 0)}개")
print()

BATCH = 50
success = 0
for i in range(0, len(rows), BATCH):
    batch = rows[i:i + BATCH]
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/words",
        headers=HEADERS,
        json=batch,
    )
    if res.status_code not in (200, 201):
        print(f"오류 발생 (batch {i}~{i+len(batch)}): {res.status_code} {res.text}")
        sys.exit(1)
    success += len(batch)
    print(f"  삽입 완료: {success}/{len(rows)}")

print(f"\n완료! words 테이블에 {success}개 삽입.")
