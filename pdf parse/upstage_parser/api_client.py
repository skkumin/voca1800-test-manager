import requests
import time
import logging
from typing import Dict

import config

logger = logging.getLogger(__name__)


class UpstageAPIClient:
    def __init__(self):
        if not config.UPSTAGE_API_KEY:
            raise ValueError("UPSTAGE_API_KEY is not set in .env file")
        self.api_key = config.UPSTAGE_API_KEY
        self.api_url = config.UPSTAGE_API_URL
        self.max_retries = config.MAX_RETRIES
        self.request_delay = config.REQUEST_DELAY_SECONDS

    def _build_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
        }

    def parse_pdf_bytes(
        self, file_bytes: bytes, filename: str, page_start: int = 1, page_end: int = None,
        use_ocr: bool = False
    ) -> Dict:
        for attempt in range(self.max_retries):
            try:
                time.sleep(self.request_delay)

                files = {"document": (filename, file_bytes, "application/pdf")}
                headers = self._build_headers()

                # Build data parameters (enhanced mode not working, use basic params only)
                data = {}
                if use_ocr:
                    data["ocr"] = "true"

                mode_str = ""
                if use_ocr:
                    mode_str += " [OCR]"
                else:
                    mode_str = " [Basic Mode]"

                logger.info(f"Sending request to Upstage API (attempt {attempt + 1}/{self.max_retries}){mode_str}")
                response = requests.post(
                    self.api_url,
                    files=files,
                    headers=headers,
                    data=data if data else None,
                    timeout=300,
                )

                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Successfully parsed PDF chunk: pages {page_start}-{page_end}")
                    return result

                elif response.status_code == 429:
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue

                else:
                    logger.error(f"API error: {response.status_code} - {response.text}")
                    raise Exception(f"API request failed with status {response.status_code}")

            except requests.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt
                    time.sleep(wait_time)
                else:
                    raise

        raise Exception(f"Failed to parse PDF after {self.max_retries} attempts")

    def extract_pages_from_response(self, response: Dict) -> int:
        try:
            elements = response.get("elements", [])
            if not elements:
                return 0

            max_page = 0
            for element in elements:
                bounding_box = element.get("bounding_box", {})
                page = bounding_box.get("page", 0)
                max_page = max(max_page, page)

            return max_page
        except Exception as e:
            logger.warning(f"Could not extract page count from response: {e}")
            return 0
