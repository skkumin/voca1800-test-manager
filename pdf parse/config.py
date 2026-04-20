import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
UPSTAGE_API_URL = os.getenv("UPSTAGE_API_URL", "https://api.upstage.ai/v1/document-ai/document-parse")

COST_PER_PAGE = float(os.getenv("COST_PER_PAGE", "0.01"))

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "50"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
REQUEST_DELAY_SECONDS = float(os.getenv("REQUEST_DELAY_SECONDS", "0.5"))

OUTPUT_DIR = BASE_DIR / os.getenv("OUTPUT_DIR", "output")
PARSED_DIR = OUTPUT_DIR / "parsed"
LOGS_DIR = OUTPUT_DIR / "logs"

COST_HISTORY_FILE = BASE_DIR / "cost_history.json"

OUTPUT_DIR.mkdir(exist_ok=True)
PARSED_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)
