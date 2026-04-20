import json
import logging
from pathlib import Path
from datetime import datetime
from uuid import uuid4
from typing import List, Dict

import config

logger = logging.getLogger(__name__)


class HistoryManager:
    def __init__(self):
        self.history_file = config.COST_HISTORY_FILE

    def load_history(self) -> Dict:
        if self.history_file.exists():
            try:
                with open(self.history_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load history: {e}")
                return self._create_empty_history()
        else:
            return self._create_empty_history()

    def _create_empty_history(self) -> Dict:
        return {
            "schema_version": "1.0",
            "records": [],
            "summary": {
                "total_files_processed": 0,
                "total_pages_processed": 0,
                "total_cost_usd": 0.0,
                "last_updated": None,
            },
        }

    def append_record(self, record: Dict) -> None:
        history = self.load_history()

        record["id"] = str(uuid4())
        record["timestamp"] = datetime.now().isoformat()

        history["records"].append(record)

        history["summary"]["total_files_processed"] = len(history["records"])
        history["summary"]["total_pages_processed"] = sum(
            r.get("total_pages", 0) for r in history["records"]
        )
        history["summary"]["total_cost_usd"] = round(
            sum(r.get("total_cost_usd", 0) for r in history["records"]), 4
        )
        history["summary"]["last_updated"] = datetime.now().isoformat()

        self._save_history(history)
        logger.info("Record appended to history")

    def _save_history(self, history: Dict) -> None:
        try:
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save history: {e}")
            raise

    def get_total_cost(self) -> float:
        history = self.load_history()
        return history["summary"]["total_cost_usd"]

    def find_by_filename(self, filename: str) -> List[Dict]:
        history = self.load_history()
        return [r for r in history["records"] if r.get("filename") == filename]

    def print_summary(self) -> None:
        history = self.load_history()
        summary = history["summary"]

        print("\n" + "=" * 60)
        print("📊 Cost History Summary")
        print("=" * 60)
        print(f"Total files processed: {summary['total_files_processed']}")
        print(f"Total pages processed: {summary['total_pages_processed']}")
        print(f"Total cost: ${summary['total_cost_usd']:.4f}")
        print(f"Last updated: {summary['last_updated']}")
        print("=" * 60)

        if history["records"]:
            print("\n📋 Recent Records:")
            for record in sorted(history["records"], key=lambda x: x["timestamp"], reverse=True)[:10]:
                print(f"\n  File: {record.get('filename')}")
                print(f"  Pages: {record.get('total_pages')} | Cost: ${record.get('total_cost_usd'):.4f}")
                print(f"  Time: {record.get('timestamp')}")
                print(f"  Status: {record.get('status')}")
        else:
            print("\n✅ No records yet. Parse a PDF to start tracking costs.")

        print("\n")
