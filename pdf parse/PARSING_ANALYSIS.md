# VOCA 1800 Parsed JSON Structure Analysis

## Overview
- **Total Elements**: 1991
- **Total Pages**: 248
- **File**: `output/parsed/2027학년 VOCA 1800_parsed.json`

---

## Document Structure

### 1. Cover & Introduction Pages (Elements 0-47, Pages 1-10)
- Cover page with title "VOCA 1800"
- PART structure (PART I-IV)
- Index of all DAYs and their page numbers
- Table of contents

### 2. Vocabulary Content Pages (Elements 48+, Pages 11+)
Organized into **DAY sections** (DAY 01 to DAY 60)

---

## DAY Section Structure

Each DAY consists of:

### A. Heading Element
```json
{
  "category": "heading1",
  "content": {
    "html": "<br><h1 id='XX' style='font-size:20px'>DAY 02</h1>",
  },
  "id": XX,
  "page": XX
}
```
Extract: `DAY 02` → `day: "DAY 02"`

### B. Vocabulary Table Element
```json
{
  "category": "table",
  "content": {
    "html": "<table>...<tr>
      <td>0031</td>
      <td>commute [kmju:t] 영 완 돋</td>
      <td>n. 통근, 출퇴근 V. 통근하다, 출퇴근하다 rely on the bus for her commute 그녀의 통근을 위해 버스에 의존하다 영어 How's the commute been? 출퇴근은 어때? 영듣</td>
    </tr>...</table>"
  }
}
```

---

## Table Row Structure

Each `<tr>` contains 3 columns:

| Column | Example | Extract As |
|--------|---------|-----------|
| 1 | `0031` | Word ID (used for ordering) |
| 2 | `commute [kmju:t] 영 완 돋` | Word + pronunciation + source tags |
| 3 | Full meaning, definition, example sentences | Meaning + sentences |

### Column 2: Word Information
```
commute [kmju:t] 영 완 돋
├─ word: "commute"
├─ pronunciation: "[kmju:t]"
└─ source_tags: ["영", "완", "돋"] (수능특강 영어, 수능완성, 수능특강 영어듣기)
```

### Column 3: Definition & Sentences
```
n. 통근, 출퇴근 V. 통근하다, 출퇴근하다 
rely on the bus for her commute 그녀의 통근을 위해 버스에 의존하다 영어 
How's the commute been? 출퇴근은 어때? 영듣

├─ meaning: "n. 통근, 출퇴근 V. 통근하다, 출퇴근하다"
└─ sentences: [
    "rely on the bus for her commute 그녀의 통근을 위해 버스에 의존하다",
    "How's the commute been? 출퇴근은 어때?"
  ]
```

**Note**: Sentences are separated by tags like `영어`, `영듣`, `독연`, `수완` and source indicators at the end of meaning/sentence blocks.

---

## Extraction Strategy

### Step 1: Parse Table HTML
1. Find all `<h1>` or `<heading1>` elements with "DAY XX" pattern
2. For each DAY, find the following `<table>` element
3. Extract all `<tr>` rows from the table

### Step 2: Extract Word Data from Each Row
For each row:
1. Extract `<td>` columns (3 columns per row)
2. Parse Column 2:
   - Split by `[` to get word name
   - Extract pronunciation from `[...]`
   - Extract source tags at the end
3. Parse Column 3:
   - Extract meaning (text before first sentence)
   - Extract example sentences (separated by source tags)

### Step 3: Clean & Normalize
- Remove HTML tags
- Clean pronunciation brackets
- Split and deduplicate sentences
- Normalize whitespace

### Step 4: Output Format
```json
[
  {
    "day": "DAY 01",
    "word": "commute",
    "meaning": "n. 통근, 출퇴근 V. 통근하다, 출퇴근하다",
    "sentences": [
      "rely on the bus for her commute 그녀의 통근을 위해 버스에 의존하다",
      "How's the commute been? 출퇴근은 어때?"
    ]
  },
  ...
]
```

---

## Source Tags Reference
- `영` / `영어`: 영어 (English text)
- `독` / `독연`: 독해연습 (Reading comprehension)
- `수완`: 수능완성 (Complete vocabulary)
- `듣` / `영듣`: 영어듣기 (Listening)
- `완`: 수능특강

---

## Expected Output Statistics
- **Total Words**: ~1800
- **Days**: 60 (DAY 01 ~ DAY 60)
- **Words per Day**: ~30
- **Total Sentences**: ~3000-5000 (2-3 per word)

---

## Next Steps
1. ✅ Analyze structure (current)
2. → Write `extract_words.py` to parse JSON and generate words.json
3. → Write `seed_db.py` to insert words.json into Supabase
