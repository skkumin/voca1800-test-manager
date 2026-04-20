#!/usr/bin/env python3
"""
Extract words from VOCA 1800 parsed JSON - Perfect extraction of words + 2 English examples.

Input:  output/parsed/2027학년 VOCA 1800_parsed.json
Output: output/words_clean.json

Key approach:
1. Scan both heading1 and header categories for DAY
2. Parse nested tables (outer > inner)
3. Use source tags (영어, 독연, 수완, 영듣) as sentence boundaries
4. Extract only English portions of examples
"""

import json
import re
from pathlib import Path
from html.parser import HTMLParser
from typing import List, Dict


class SimpleTableParser(HTMLParser):
    """Parse HTML table to extract rows, handling nested tables."""

    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_row = []
        self.current_cell = []
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.table_depth = 0

    def handle_starttag(self, tag, _attrs):
        if tag == "table":
            self.table_depth += 1
            if self.table_depth == 1:
                self.in_table = True
                self.rows = []
                self.current_row = []
        elif tag == "tr" and self.table_depth > 0:
            self.in_row = True
            if self.table_depth > 1:
                self.current_row = []
        elif tag in ("td", "th") and self.table_depth > 0:
            self.in_cell = True
            self.current_cell = []

    def handle_endtag(self, tag):
        if tag == "table":
            self.table_depth -= 1
            if self.table_depth == 0:
                self.in_table = False
        elif tag == "tr" and self.table_depth > 0:
            self.in_row = False
            if self.current_row and self.table_depth == 1:
                self.rows.append(self.current_row)
                self.current_row = []
        elif tag in ("td", "th") and self.table_depth > 0:
            self.in_cell = False
            cell_text = "".join(self.current_cell).strip()
            if self.table_depth == 1:
                self.current_row.append(cell_text)
            elif self.table_depth == 2:
                self.current_cell = [cell_text]

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell.append(data)


def extract_html_table(html: str) -> List[List[str]]:
    """Parse HTML table and return all rows (including nested)."""
    parser = SimpleTableParser()
    try:
        parser.feed(html)
        return parser.rows
    except Exception as e:
        print(f"  Error parsing table: {e}")
        return []


def extract_nested_table_rows(html: str) -> List[List[str]]:
    """
    Extract rows from nested table structure.
    Handle outer > inner table architecture.
    """
    rows = []

    # Find all nested tables
    nested_tables = re.findall(
        r'<table[^>]*>.*?</table>',
        html,
        re.DOTALL | re.IGNORECASE
    )

    for table_html in nested_tables:
        parser = SimpleTableParser()
        try:
            parser.feed(table_html)
            rows.extend(parser.rows)
        except:
            pass

    return rows


def extract_english_sentence(text: str) -> str:
    """
    Extract English sentence from mixed English/Korean text.

    Looks for sentences that:
    - Start with capital letter
    - Are followed by period or end of string
    - Have English content
    """
    text = text.strip()
    if not text or len(text) < 8:
        return ""

    # Find English sentence: CAPITAL LETTER ... period
    # Match: starts with capital, contains mostly English/spaces, ends with period
    match = re.search(r'([A-Z][A-Za-z\s,.\'"-]*[.!?]?)', text)
    if match:
        sentence = match.group(1).strip()
        # Validate: must have English chars and not too much Korean
        english_ratio = len(re.findall(r'[A-Za-z]', sentence)) / len(sentence) if sentence else 0
        korean_ratio = len(re.findall(r'[\uac00-\ud7af]', sentence)) / len(sentence) if sentence else 0

        if english_ratio > 0.5 and english_ratio > korean_ratio:
            # Ensure ends with punctuation
            if sentence and sentence[-1] not in '.!?':
                sentence += '.'
            return sentence

    return ""


def extract_sentences_from_definition(def_text: str) -> List[str]:
    """
    Extract exactly 2 English example sentences from definition text.

    Format:
    "[Korean meaning] [example1_en] [example1_ko] SOURCE_TAG [example2_en] [example2_ko] SOURCE_TAG"

    Strategy:
    1. Split by source tags (영어, 독연, 수완, 영듣)
    2. Each block between tags contains: [english_sentence] [korean_translation]
    3. Extract English sentence from each block
    """
    SOURCE_TAGS_PATTERN = r'영어|독연|수완|영듣'

    # Split by source tags and keep them
    parts = re.split(f'({SOURCE_TAGS_PATTERN})', def_text)

    sentences = []
    i = 0
    while i < len(parts):
        part = parts[i].strip()

        # Skip empty parts and tags themselves
        if not part or re.match(SOURCE_TAGS_PATTERN, part):
            i += 1
            continue

        # This part should contain: [english_sentence] [korean_translation]
        # Extract English portion
        english = extract_english_sentence(part)

        if english and len(english) > 8:
            sentences.append(english)

        if len(sentences) >= 2:
            break

        i += 1

    return sentences[:2]  # Maximum 2 sentences


def parse_word_from_cell(word_cell: str) -> str:
    """Extract word from cell: 'enrich [inrit] 영 독' → 'enrich'"""
    word_cell = word_cell.strip()

    # Match word (before bracket or space)
    match = re.match(r'^([A-Za-z]+)', word_cell)
    if match:
        return match.group(1)

    return ""


def extract_words_from_json(json_path: str) -> List[Dict]:
    """Extract all words from JSON, using heading1 + header for DAY identification."""

    with open(json_path, 'r', encoding='utf-8', errors='replace') as f:
        data = json.load(f)

    elements = data.get('elements', [])
    words = []
    current_day = None
    seen_days = set()

    i = 0
    while i < len(elements):
        elem = elements[i]

        # Look for DAY in heading1 or header
        if elem.get('category') in ('heading1', 'header'):
            html = elem.get('content', {}).get('html', '')
            match = re.search(r'DAY\s+(\d+)', html)
            if match:
                day_num = int(match.group(1))
                current_day = f"DAY {day_num:02d}"
                if current_day not in seen_days:
                    print(f"Found {current_day} (element {i})")
                    seen_days.add(current_day)

        # Look for tables following a DAY
        elif elem.get('category') == 'table' and current_day:
            html = elem.get('content', {}).get('html', '')

            # Extract all nested table rows
            all_rows = extract_nested_table_rows(html)

            words_added = 0
            for row in all_rows:
                if not row or len(row) < 2:
                    continue

                # Handle both 3-column (id, word, def) and 2-column (word, def)
                if len(row) >= 3:
                    word_cell = row[1]
                    def_cell = row[2]
                elif len(row) == 2:
                    word_cell = row[0]
                    def_cell = row[1]
                else:
                    continue

                # Parse word
                word = parse_word_from_cell(word_cell)

                # Validation
                if not word or len(word) < 2:
                    continue
                if word.isdigit() or word.upper() in ['DAY', 'DAYS', 'QUICK', 'CHECK', 'WEEK']:
                    continue

                # Extract sentences
                sentences = extract_sentences_from_definition(def_cell)
                if not sentences:
                    continue

                words.append({
                    "day": current_day,
                    "word": word,
                    "meaning": None,
                    "sentences": sentences
                })
                words_added += 1

            if words_added > 0:
                print(f"  Added {words_added} words")

        i += 1

    return words


def save_words_json(words: List[Dict], output_path: str) -> None:
    """Save extracted words to JSON file."""
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(words)} words to {output_path}")


def main():
    parsed_json = Path(__file__).parent / "output" / "parsed" / "2027학년 VOCA 1800_parsed.json"
    output_json = Path(__file__).parent / "output" / "words_clean.json"

    if not parsed_json.exists():
        print(f"ERROR: Parsed JSON not found: {parsed_json}")
        return 1

    print(f"Extracting words from {parsed_json.name}...\n")

    words = extract_words_from_json(str(parsed_json))

    if not words:
        print("ERROR: No words extracted!")
        return 1

    save_words_json(words, str(output_json))

    # Statistics
    print(f"\nStatistics:")
    print(f"  Total words: {len(words)}")

    days = sorted(set(w['day'] for w in words))
    print(f"  Days: {days[0]} ~ {days[-1]} ({len(days)} days)")

    total_sentences = sum(len(w.get('sentences', [])) for w in words)
    print(f"  Total sentences: {total_sentences}")
    print(f"  Avg per word: {total_sentences / len(words):.1f}" if words else "")

    return 0


if __name__ == "__main__":
    exit(main())
