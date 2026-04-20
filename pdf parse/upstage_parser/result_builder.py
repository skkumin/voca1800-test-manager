import json
import logging
from typing import List, Dict
from pathlib import Path

logger = logging.getLogger(__name__)


class ResultBuilder:
    @staticmethod
    def merge_chunk_results(
        chunk_results: List[Dict], chunk_pages: List[tuple]
    ) -> Dict:
        merged_elements = []
        page_offset = 0

        for idx, (chunk_result, (page_start, page_end)) in enumerate(
            zip(chunk_results, chunk_pages)
        ):
            elements = chunk_result.get("elements", [])

            for element in elements:
                bounding_box = element.get("bounding_box", {})
                original_page = bounding_box.get("page", 0)

                adjusted_element = element.copy()
                if adjusted_element.get("bounding_box"):
                    adjusted_element["bounding_box"] = bounding_box.copy()
                    adjusted_element["bounding_box"]["page"] = original_page + page_start - 1

                merged_elements.append(adjusted_element)

            logger.debug(f"Processed chunk {idx + 1}: {len(elements)} elements")

        return {
            "elements": merged_elements,
            "metadata": {
                "total_pages": chunk_pages[-1][1] if chunk_pages else 0,
                "total_elements": len(merged_elements),
                "chunks_merged": len(chunk_results),
            },
        }

    @staticmethod
    def save_parsed_result(result: Dict, output_path: str) -> str:
        try:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            logger.info(f"Saved parsed result to {output_path}")
            return str(output_path)
        except Exception as e:
            logger.error(f"Failed to save result: {e}")
            raise
