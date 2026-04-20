import logging
from typing import Dict, List

import config

logger = logging.getLogger(__name__)


class CostCalculator:
    @staticmethod
    def calculate_cost(page_count: int) -> float:
        return page_count * config.COST_PER_PAGE

    @staticmethod
    def summarize_session_cost(
        total_pages: int, successful_chunks: int, failed_chunks: int
    ) -> Dict:
        total_cost = CostCalculator.calculate_cost(total_pages)

        return {
            "total_pages_billed": total_pages,
            "successful_chunks": successful_chunks,
            "failed_chunks": failed_chunks,
            "cost_per_page": config.COST_PER_PAGE,
            "total_cost_usd": round(total_cost, 4),
        }

    @staticmethod
    def extract_pages_from_result(result: Dict) -> int:
        try:
            metadata = result.get("metadata", {})
            return metadata.get("total_pages", 0)
        except Exception as e:
            logger.warning(f"Could not extract page count: {e}")
            return 0
