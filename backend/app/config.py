from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
UPLOADS_DIR = DATA_DIR / "uploads"
JOBS_DIR = DATA_DIR / "jobs"

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
TASK_ALWAYS_EAGER = os.getenv("TASK_ALWAYS_EAGER", "false").lower() in ("1", "true", "yes")

SESSION_COOKIE_NAME = "string_art_session"
SESSION_HEADER_NAME = "X-Session-ID"

# Security limits
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 15 * 1024 * 1024))  # 15MB
MAX_PIXELS = int(os.getenv("MAX_PIXELS", 25_000_000))  # 25 MP decomp bomb protection
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Defaults
DEFAULT_NAILS = 200
DEFAULT_STEPS = 3000
DEFAULT_DIAMETER_MM = 400.0
DEFAULT_STRENGTH = 0.12
DEFAULT_MIN_GAP = 10
DEFAULT_SIZE = 300
DEFAULT_ALLOWANCE_PCT = 15.0  # 15% extra thread for wraps/knots

# Ensure base directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
JOBS_DIR.mkdir(parents=True, exist_ok=True)
