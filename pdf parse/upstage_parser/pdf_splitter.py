import fitz
import logging
from typing import List, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


class PDFSplitter:
    @staticmethod
    def get_page_count(pdf_path: str) -> int:
        try:
            doc = fitz.open(pdf_path)
            page_count = len(doc)
            doc.close()
            return page_count
        except Exception as e:
            logger.error(f"Failed to read PDF: {e}")
            raise

    @staticmethod
    def needs_splitting(pdf_path: str, chunk_size: int) -> bool:
        page_count = PDFSplitter.get_page_count(pdf_path)
        return page_count > chunk_size

    @staticmethod
    def split_into_chunks(
        pdf_path: str, chunk_size: int
    ) -> List[Tuple[bytes, int, int]]:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        chunks = []

        for start_page in range(0, total_pages, chunk_size):
            end_page = min(start_page + chunk_size, total_pages)

            chunk_doc = fitz.open()
            chunk_doc.insert_pdf(doc, from_page=start_page, to_page=end_page - 1)

            chunk_bytes = chunk_doc.write()
            chunks.append((chunk_bytes, start_page + 1, end_page))

            chunk_doc.close()

            logger.info(f"Created chunk: pages {start_page + 1}-{end_page} ({end_page - start_page} pages)")

        doc.close()
        logger.info(f"Split PDF into {len(chunks)} chunks")
        return chunks
