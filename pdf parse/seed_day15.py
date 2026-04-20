#!/usr/bin/env python3
"""
Seed only DAY 15 words to Supabase words table.
"""

import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / "word-test-app" / ".env.local"
load_dotenv(env_path)


def get_supabase_config() -> tuple[str, str]:
    """Get Supabase URL and API key from environment variables."""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("ERROR: Supabase credentials not found in .env.local")
        exit(1)

    return url, key


def load_words_json(filepath: str) -> list:
    """Load words from JSON file and filter DAY 15 only."""
    with open(filepath, 'r', encoding='utf-8') as f:
        all_words = json.load(f)

    # Filter only DAY 15
    day15_words = [w for w in all_words if w.get("day") == "DAY 15"]
    return day15_words


def seed_words(supabase_url: str, supabase_key: str, words: list, batch_size: int = 100) -> None:
    """
    Insert words into Supabase words table using REST API.
    """
    total = len(words)
    inserted = 0
    failed = 0

    print(f"Seeding {total} DAY 15 words to Supabase...\n")

    # REST API endpoint
    api_url = f"{supabase_url}/rest/v1/words"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # Process in batches
    for i in range(0, total, batch_size):
        batch = words[i:i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total + batch_size - 1) // batch_size

        try:
            # Prepare data for insertion
            data_to_insert = []
            for word_entry in batch:
                data_to_insert.append({
                    "word": word_entry.get("word", ""),
                    "meaning": word_entry.get("meaning") or "",
                    "sentences": word_entry.get("sentences", []),
                    "day": word_entry.get("day", ""),
                })

            # Insert batch via REST API
            response = requests.post(
                api_url,
                headers=headers,
                json=data_to_insert,
                timeout=30
            )

            if response.status_code in (200, 201):
                inserted += len(data_to_insert)
                print(f"  Batch {batch_num}/{total_batches}: {len(data_to_insert)} words inserted")
            else:
                failed += len(batch)
                error_detail = response.text[:150] if response.text else str(response.status_code)
                print(f"  Batch {batch_num}/{total_batches} failed: {response.status_code}")
                print(f"    Error: {error_detail}")

        except Exception as e:
            failed += len(batch)
            print(f"  Batch {batch_num}/{total_batches} error: {str(e)[:100]}")

    print(f"\n{'='*50}")
    print(f"DAY 15 Seeding complete:")
    print(f"  Inserted: {inserted}")
    print(f"  Failed: {failed}")
    print(f"  Total: {inserted + failed}")
    print(f"{'='*50}")

    if failed == 0:
        print("\nAll DAY 15 words successfully seeded to Supabase!")
    else:
        print(f"\n{failed} words failed to insert")


def main():
    words_json_path = Path(__file__).parent.parent / "words.json"

    if not words_json_path.exists():
        print(f"ERROR: words.json not found: {words_json_path}")
        return 1

    print("Loading Supabase credentials...")
    supabase_url, supabase_key = get_supabase_config()
    print("Credentials loaded\n")

    print(f"Loading words from {words_json_path.name}...")
    words = load_words_json(str(words_json_path))
    print(f"Loaded {len(words)} DAY 15 words\n")

    if not words:
        print("ERROR: No DAY 15 words found!")
        return 1

    # Seed new data (no deletion, just append)
    seed_words(supabase_url, supabase_key, words)

    return 0


if __name__ == "__main__":
    exit(main())
