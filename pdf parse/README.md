# PDF Parser for RAG - Upstage Document Parser Integration

## 📋 Overview

This project provides an automated pipeline for parsing large PDF documents using the **Upstage Document Parser API**, with built-in cost tracking and history management. Designed for preparing documents for RAG (Retrieval-Augmented Generation) applications.

**Key Features:**
- Parse large PDFs (100+ pages) with automatic chunking
- Real-time API cost tracking and historical analysis
- Exponential backoff retry logic for rate limiting
- Clean JSON output with metadata preservation

---

## 🎯 Prerequisites

- **Python 3.10+**
- **Upstage API Key** - Get one at [Upstage Console](https://console.upstage.ai)

---

## 🚀 Installation

### 1. Clone and Setup

```bash
cd c:\Users\mingue\dev\edu-tool
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
UPSTAGE_API_KEY=your_actual_api_key_here
UPSTAGE_API_URL=https://api.upstage.ai/v1/document-ai/document-parse
COST_PER_PAGE=0.01
CHUNK_SIZE=50
MAX_RETRIES=3
REQUEST_DELAY_SECONDS=0.5
OUTPUT_DIR=output
```

---

## ⚙️ Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `UPSTAGE_API_KEY` | string | **Required** | Your Upstage API authentication token |
| `UPSTAGE_API_URL` | string | https://api.upstage.ai/v1/document-ai/document-parse | API endpoint URL |
| `COST_PER_PAGE` | float | 0.01 | USD cost per page (check Upstage pricing) |
| `CHUNK_SIZE` | int | 50 | Pages per API request (memory optimization) |
| `MAX_RETRIES` | int | 3 | Max retry attempts on failure |
| `REQUEST_DELAY_SECONDS` | float | 0.5 | Delay between API requests (rate limiting) |
| `OUTPUT_DIR` | string | output | Directory for parsed results |

**Notes:**
- `COST_PER_PAGE`: Update based on current Upstage pricing
- `CHUNK_SIZE`: Balance between memory usage and API calls (50 is recommended)
- `MAX_RETRIES`: Higher values = more tolerant but slower recovery

---

## 💻 Usage

### Basic Parsing

Parse a PDF and save results:

```bash
python main.py --input PDF/2025_연말정산교재.pdf
```

**Output:**
- `output/parsed/2025_연말정산교재_parsed.json` - Parsed document
- `cost_history.json` - Updated cost record

### Dry Run (Estimate Cost)

Check expected cost without making API calls:

```bash
python main.py --input PDF/2025_연말정산교재.pdf --dry-run
```

**Output:**
```
📄 File: 2025_연말정산교재.pdf
📊 Pages: 588
💰 Expected cost: $5.88
```

### Custom Chunk Size

Process with different chunk sizes (useful for memory constraints):

```bash
python main.py --input PDF/sample.pdf --chunk-size 30
```

### View Cost History

Display cumulative costs and recent records:

```bash
python main.py --history
```

**Output:**
```
============================================================
📊 Cost History Summary
============================================================
Total files processed: 2
Total pages processed: 800
Total cost: $8.00
Last updated: 2026-04-20T14:32:00+09:00
============================================================

📋 Recent Records:

  File: 2025_연말정산교재.pdf
  Pages: 588 | Cost: $5.88
  Time: 2026-04-20T14:32:00+09:00
  Status: success
```

---

## 📊 Cost Policy and Tracking

### How Costs are Calculated

```
Cost = Total Pages × Cost Per Page

Example (588 pages @ $0.01/page):
Cost = 588 × $0.01 = $5.88 USD
```

### Cost History Schema

The `cost_history.json` file tracks all parsing operations:

```json
{
  "schema_version": "1.0",
  "records": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "timestamp": "2026-04-20T14:32:00+09:00",
      "filename": "2025_연말정산교재.pdf",
      "file_size_mb": 57.3,
      "total_pages": 588,
      "chunks_count": 12,
      "cost_per_page": 0.01,
      "total_cost_usd": 5.88,
      "api_usage": {
        "total_pages_billed": 588,
        "successful_chunks": 12,
        "failed_chunks": 0
      },
      "output_file": "output/parsed/2025_연말정산교재_parsed.json",
      "status": "success"
    }
  ],
  "summary": {
    "total_files_processed": 1,
    "total_pages_processed": 588,
    "total_cost_usd": 5.88,
    "last_updated": "2026-04-20T14:32:00+09:00"
  }
}
```

### Record Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique record identifier |
| `timestamp` | ISO 8601 | When parsing occurred (local timezone) |
| `filename` | string | Original PDF filename |
| `file_size_mb` | float | File size in megabytes |
| `total_pages` | int | Number of pages in PDF |
| `chunks_count` | int | How many API requests were made |
| `cost_per_page` | float | Unit price (snapshot at parse time) |
| `total_cost_usd` | float | Total USD cost for this operation |
| `api_usage` | object | Details on successful/failed chunks |
| `output_file` | string | Path to saved JSON result |
| `status` | string | `success`, `partial`, or `failed` |

**Why store `cost_per_page`?** Upstage may change pricing in the future. Storing the unit price per record ensures historical accuracy.

---

## 📄 Output File Structure

### Parsed JSON Format

```json
{
  "elements": [
    {
      "type": "text",
      "content": "제1장 근로소득",
      "bounding_box": {
        "x": 50,
        "y": 100,
        "width": 500,
        "height": 50,
        "page": 1
      }
    },
    {
      "type": "table",
      "content": [
        ["기본공제액", "150만원"],
        ["자녀공제액", "1자녀 15만원"]
      ],
      "bounding_box": {
        "page": 45
      }
    }
  ],
  "metadata": {
    "total_pages": 588,
    "total_elements": 12543,
    "chunks_merged": 12
  }
}
```

### Element Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Regular paragraph | Chapter titles, body text |
| `heading` | Section or subsection | "기본공제", "세율표" |
| `table` | Structured data | Tax rates, deduction amounts |
| `figure` | Image or diagram | Charts, diagrams |
| `list` | Numbered or bulleted | Numbered steps |

### Bounding Box

Each element has coordinates for document reconstruction:

```
bounding_box: {
  "x": 50,           # Horizontal position (pixels)
  "y": 100,          # Vertical position (pixels)
  "width": 500,      # Element width
  "height": 50,      # Element height
  "page": 1          # Page number (1-indexed)
}
```

---

## 📦 Large File Processing

### How Chunking Works

Large PDFs are split into smaller chunks to optimize memory and API reliability.

**Example: 588-page PDF with 50-page chunks**

```
PDF (588 pages)
    ↓
┌─────────────────────────────────────────┐
│ Chunk 1: Pages 1-50                     │ ← API Call 1
│ Chunk 2: Pages 51-100                   │ ← API Call 2
│ Chunk 3: Pages 101-150                  │ ← API Call 3
│ ...                                     │
│ Chunk 12: Pages 551-588                 │ ← API Call 12
└─────────────────────────────────────────┘
    ↓
Merge all chunks → Final JSON
```

### Configuration

- **Default chunk size:** 50 pages
- **Recommended for most cases:** 50-100 pages
- **For high-memory systems:** 100-200 pages
- **For low-memory systems:** 25-50 pages

Change via command line:

```bash
python main.py --input file.pdf --chunk-size 30
```

Or edit `.env`:

```env
CHUNK_SIZE=75
```

### Partial Failures

If some chunks fail, status is marked as `partial`:

```json
{
  "status": "partial",
  "api_usage": {
    "successful_chunks": 11,
    "failed_chunks": 1
  }
}
```

You can:
1. Re-run the command (automatic retry with exponential backoff)
2. Reduce chunk size to isolate the problem
3. Check API quotas and rate limits

---

## ❌ Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `UPSTAGE_API_KEY is not set` | Missing `.env` file | Create `.env` and add API key |
| `API request failed with status 401` | Invalid/expired API key | Check key in Upstage Console |
| `API request failed with status 429` | Rate limited | Increase `REQUEST_DELAY_SECONDS` in `.env` |
| `PDF file not found` | Wrong file path | Use absolute or correct relative path |
| `Failed to read PDF` | Corrupted file | Try opening file in PDF reader |
| `Failed to parse PDF after 3 attempts` | API unavailable | Wait and retry; check Upstage status |

### Retry Logic

The system automatically retries failed API calls with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: Wait 1 second, retry
Attempt 3: Wait 2 seconds, retry
```

Increase `MAX_RETRIES` in `.env` for more attempts (trade-off: slower execution).

### Logging

All operations are logged to console with timestamps:

```
2026-04-20 14:32:00 - parser.api_client - INFO - Sending request to Upstage API
2026-04-20 14:32:05 - parser.api_client - INFO - Successfully parsed PDF chunk: pages 1-50
```

Increase verbosity by modifying `logging.basicConfig()` in `main.py` if needed.

---

## 📁 Project Structure

```
edu-tool/
│
├── .env                          # Environment variables (DO NOT COMMIT)
├── .env.example                  # Template for .env (safe to commit)
├── .gitignore                    # Git exclusions
├── requirements.txt              # Python dependencies
├── README.md                     # This file
├── config.py                     # Global configuration loader
├── main.py                       # CLI entry point
│
├── parser/                       # PDF parsing module
│   ├── __init__.py
│   ├── api_client.py            # Upstage API communication
│   ├── pdf_splitter.py          # Large PDF chunking
│   └── result_builder.py        # Merge and save results
│
├── tracker/                      # Cost tracking module
│   ├── __init__.py
│   ├── cost_calculator.py       # Cost computation
│   └── history_manager.py       # cost_history.json management
│
├── output/                       # Results directory (gitignored)
│   ├── parsed/                  # JSON output files
│   └── logs/                    # Processing logs
│
└── cost_history.json             # Cost history (gitignored)
```

### File Responsibilities

| File | Purpose |
|------|---------|
| `config.py` | Load `.env` vars, set global constants |
| `main.py` | CLI argument parsing, orchestrate pipeline |
| `api_client.py` | HTTP requests to Upstage API |
| `pdf_splitter.py` | Split large PDFs into manageable chunks |
| `result_builder.py` | Merge chunk results into single JSON |
| `cost_calculator.py` | Calculate costs from page counts |
| `history_manager.py` | CRUD operations on cost_history.json |

---

## 🔐 Security Notes

1. **Never commit `.env`** - Contains API keys
   - Added to `.gitignore` automatically
   - Always use `.env.example` in repositories

2. **API Key Safety**
   - Rotate keys regularly in Upstage Console
   - Use `.env.local` for machine-specific overrides

3. **Output Files**
   - Parsed JSONs are public (unless containing sensitive data)
   - Keep `cost_history.json` private (contains pricing info)

---

## 🤝 Workflow Example

### Step 1: Estimate Cost

```bash
python main.py --input PDF/2025_연말정산교재.pdf --dry-run
```

Output:
```
📄 File: 2025_연말정산교재.pdf
📊 Pages: 588
💰 Expected cost: $5.88
```

### Step 2: Parse Document

```bash
python main.py --input PDF/2025_연말정산교재.pdf
```

Logs:
```
2026-04-20 14:32:00 - __main__ - INFO - PDF has 588 pages
2026-04-20 14:32:00 - __main__ - INFO - File exceeds 50 pages, splitting...
2026-04-20 14:32:02 - parser.pdf_splitter - INFO - Split PDF into 12 chunks
2026-04-20 14:32:02 - __main__ - INFO - Parsing chunk 1/12 (pages 1-50)...
...
2026-04-20 14:33:45 - __main__ - INFO - Merging 12 results...
✅ Parsing complete!
📊 Total pages: 588
💾 Output: output/parsed/2025_연말정산교재_parsed.json
💰 Cost: $5.88
```

### Step 3: Verify Results

```bash
python main.py --history
```

Output:
```
============================================================
📊 Cost History Summary
============================================================
Total files processed: 1
Total pages processed: 588
Total cost: $5.88
Last updated: 2026-04-20T14:33:45+09:00
============================================================

📋 Recent Records:

  File: 2025_연말정산교재.pdf
  Pages: 588 | Cost: $5.88
  Time: 2026-04-20T14:33:45+09:00
  Status: success
```

### Step 4: Process Output

The `2025_연말정산교재_parsed.json` is now ready for:
- **RAG Embedding**: Vector embedding for similarity search
- **Text Extraction**: Copy text for downstream NLP tasks
- **Data Analysis**: Query structured elements (tables, lists)
- **Indexing**: Build search indexes from metadata

---

## 📚 Advanced Usage

### Process Multiple Files

```bash
for file in PDF/*.pdf; do
  python main.py --input "$file"
done
```

### Adjust for Specific Needs

**High reliability (more retries):**
```bash
# Edit .env
MAX_RETRIES=5
REQUEST_DELAY_SECONDS=1.0
```

**Fast processing (larger chunks):**
```bash
# Edit .env
CHUNK_SIZE=100
REQUEST_DELAY_SECONDS=0.2
```

**Memory-constrained (smaller chunks):**
```bash
python main.py --input file.pdf --chunk-size 25
```

---

## 🐛 Troubleshooting

### "API Key Error"

```bash
# Verify .env exists and has UPSTAGE_API_KEY
cat .env

# Test API key directly
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.upstage.ai/v1/document-ai/document-parse \
  -F "document=@test.pdf"
```

### "Timeout or Connection Error"

- Check internet connection
- Verify Upstage API status at https://status.upstage.ai
- Try reducing `REQUEST_DELAY_SECONDS` or increasing `MAX_RETRIES`

### "Out of Memory"

- Reduce `CHUNK_SIZE` to 25 or 30
- Process smaller PDFs individually
- Increase system RAM if possible

### "Partial Failures"

```bash
# Re-run (automatic retry will help)
python main.py --input file.pdf

# Or check with smaller chunks
python main.py --input file.pdf --chunk-size 25
```

---

## 📞 Support

- **Upstage API Issues**: [Upstage Console](https://console.upstage.ai)
- **Python Issues**: [Python Docs](https://docs.python.org/3.10/)
- **PDF Processing**: Check if PDF is corrupted (try opening in PDF reader)

---

## 📄 License

This project is provided as-is for educational and commercial use with Upstage API.

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-20 | Initial release with cost tracking |

---

## ✅ Checklist

Before processing production data:

- [ ] API key configured in `.env`
- [ ] Tested with small PDF (--dry-run first)
- [ ] Verified `cost_history.json` is created
- [ ] Confirmed output JSON structure with `--input sample.pdf`
- [ ] Set up `.gitignore` to exclude `.env` and `cost_history.json`
- [ ] Documented any custom environment settings

