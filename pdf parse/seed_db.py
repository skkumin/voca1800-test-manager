#!/usr/bin/env python3
"""
Seed Supabase words table with extracted VOCA 1800 data.

Input:  output/words_clean.json (from extract_words.py)
Output: Inserts into Supabase words table
"""

import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from word-test-app
env_path = Path(__file__).parent.parent / "word-test-app" / ".env.local"
load_dotenv(env_path)


def get_supabase_config() -> tuple[str, str]:
    """Get Supabase URL and API key from environment variables."""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        print("ERROR: Supabase credentials not found in .env.local")
        print("  Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set")
        exit(1)

    return url, key


def load_words_json(filepath: str) -> list:
    """Load words from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def delete_existing_words(supabase_url: str, supabase_key: str) -> None:
    """Delete all words and dependent records from Supabase to start fresh."""
    print("Deleting existing data from Supabase...")

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    }

    # Step 1: Delete from sentence_usage first (references words via FK)
    print("  Deleting sentence_usage records...")
    url = f"{supabase_url}/rest/v1/sentence_usage?id=not.is.null"
    response = requests.delete(url, headers=headers)

    if response.status_code in (200, 204):
        print("    ✓ sentence_usage cleared")
    else:
        print(f"    Warning: sentence_usage delete returned {response.status_code}")
        if response.text:
            print(f"    Response: {response.text[:200]}")

    # Step 2: Delete from words table
    print("  Deleting words records...")
    url = f"{supabase_url}/rest/v1/words?id=not.is.null"
    response = requests.delete(url, headers=headers)

    if response.status_code in (200, 204):
        print("  ✓ All words deleted\n")
    else:
        print(f"  Warning: Delete returned {response.status_code}")
        if response.text:
            print(f"  Response: {response.text[:200]}\n")


def seed_words(supabase_url: str, supabase_key: str, words: list, batch_size: int = 100) -> None:
    """
    Insert words into Supabase words table using REST API.

    Table schema:
    - id: uuid (auto)
    - word: text (NOT NULL)
    - meaning: text (nullable, use empty string)
    - sentences: text[] (NOT NULL)
    - day: text (NOT NULL)
    """
    total = len(words)
    inserted = 0
    failed = 0

    print(f"Seeding {total} words to Supabase...\n")

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
                    "meaning": word_entry.get("meaning") or "",  # Use empty string for null
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
    print(f"Seeding complete:")
    print(f"  Inserted: {inserted}")
    print(f"  Failed: {failed}")
    print(f"  Total: {inserted + failed}")
    print(f"{'='*50}")

    if failed == 0:
        print("\n✅ All words successfully seeded to Supabase!")
    else:
        print(f"\n⚠️  {failed} words failed to insert")


def main():
    # Load from parent directory (clean data provided by user)
    words_json_path = Path(__file__).parent.parent / "words.json"

    if not words_json_path.exists():
        print(f"ERROR: words.json not found: {words_json_path}")
        return 1

    print("Loading Supabase credentials...")
    supabase_url, supabase_key = get_supabase_config()
    print("✓ Credentials loaded\n")

    print(f"Loading words from {words_json_path.name}...")
    words = load_words_json(str(words_json_path))
    print(f"✓ Loaded {len(words)} words\n")

    # Delete existing data
    delete_existing_words(supabase_url, supabase_key)

    # Seed new data
    seed_words(supabase_url, supabase_key, words)

    return 0


if __name__ == "__main__":
    exit(main())
