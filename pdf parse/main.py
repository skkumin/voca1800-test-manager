#!/usr/bin/env python3

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from upstage_parser.api_client import UpstageAPIClient
from upstage_parser.pdf_splitter import PDFSplitter
from upstage_parser.result_builder import ResultBuilder
from tracker.cost_calculator import CostCalculator
from tracker.history_manager import HistoryManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Parse PDFs using Upstage API and track costs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --input PDF/sample.pdf
  python main.py --input PDF/sample.pdf --dry-run
  python main.py --input PDF/sample.pdf --chunk-size 30
  python main.py --history
        """,
    )

    parser.add_argument(
        "--input",
        "-i",
        type=str,
        help="Path to PDF file to parse",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Calculate expected cost without making API calls",
    )
    parser.add_argument(
        "--history",
        action="store_true",
        help="Display cost history",
    )
    parser.add_argument(
        "--chunk-size",
        "-c",
        type=int,
        default=config.CHUNK_SIZE,
        help=f"Pages per chunk (default: {config.CHUNK_SIZE})",
    )

    args = parser.parse_args()

    if args.history:
        history_manager = HistoryManager()
        history_manager.print_summary()
        return

    if not args.input:
        parser.print_help()
        sys.exit(1)

    pdf_path = Path(args.input)
    if not pdf_path.exists():
        logger.error(f"PDF file not found: {pdf_path}")
        sys.exit(1)

    try:
        page_count = PDFSplitter.get_page_count(str(pdf_path))
        logger.info(f"PDF has {page_count} pages")

        expected_cost = CostCalculator.calculate_cost(page_count)
        print(f"\n📄 File: {pdf_path.name}")
        print(f"📊 Pages: {page_count}")
        print(f"💰 Expected cost: ${expected_cost:.4f}")

        if args.dry_run:
            logger.info("Dry-run mode: API calls skipped")
            return

        parse_pdf(pdf_path, args.chunk_size)

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)


def parse_pdf(pdf_path: Path, chunk_size: int) -> None:
    logger.info(f"Starting PDF parsing: {pdf_path}")

    api_client = UpstageAPIClient()
    history_manager = HistoryManager()

    needs_split = PDFSplitter.needs_splitting(str(pdf_path), chunk_size)

    if needs_split:
        logger.info(f"File exceeds {chunk_size} pages, splitting...")
        chunks = PDFSplitter.split_into_chunks(str(pdf_path), chunk_size)
    else:
        logger.info("File fits in single chunk")
        chunks = [(Path(pdf_path).read_bytes(), 1, PDFSplitter.get_page_count(str(pdf_path)))]

    chunk_results = []
    chunk_pages = []
    successful_chunks = 0
    failed_chunks = 0

    for idx, (chunk_bytes, page_start, page_end) in enumerate(chunks, 1):
        try:
            logger.info(f"Parsing chunk {idx}/{len(chunks)} (pages {page_start}-{page_end})...")
            result = api_client.parse_pdf_bytes(chunk_bytes, pdf_path.name, page_start, page_end)

            chunk_results.append(result)
            chunk_pages.append((page_start, page_end))
            successful_chunks += 1

        except Exception as e:
            logger.error(f"Failed to parse chunk {idx}: {e}")
            failed_chunks += 1

    if not chunk_results:
        logger.error("All chunks failed to parse")
        return

    logger.info(f"Merging {len(chunk_results)} results...")
    merged_result = ResultBuilder.merge_chunk_results(chunk_results, chunk_pages)

    total_pages = merged_result["metadata"]["total_pages"]
    cost_summary = CostCalculator.summarize_session_cost(total_pages, successful_chunks, failed_chunks)

    output_filename = f"{pdf_path.stem}_parsed.json"
    output_path = config.PARSED_DIR / output_filename

    ResultBuilder.save_parsed_result(merged_result, str(output_path))

    file_size_mb = pdf_path.stat().st_size / (1024 * 1024)
    record = {
        "filename": pdf_path.name,
        "file_size_mb": round(file_size_mb, 2),
        "total_pages": total_pages,
        "chunks_count": len(chunks),
        "cost_per_page": config.COST_PER_PAGE,
        "total_cost_usd": cost_summary["total_cost_usd"],
        "api_usage": {
            "total_pages_billed": cost_summary["total_pages_billed"],
            "successful_chunks": successful_chunks,
            "failed_chunks": failed_chunks,
        },
        "output_file": str(output_path),
        "status": "success" if failed_chunks == 0 else "partial",
    }

    history_manager.append_record(record)

    print(f"\n✅ Parsing complete!")
    print(f"📊 Total pages: {total_pages}")
    print(f"💾 Output: {output_path}")
    print(f"💰 Cost: ${cost_summary['total_cost_usd']:.4f}")
    print()


if __name__ == "__main__":
    main()
