import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from pythonjsonlogger import jsonlogger
from .config import LOG_LEVEL, LOG_FILE

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

logger = logging.getLogger("starwars_api")
logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

if logger.handlers:
    logger.handlers.clear()

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_format = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(console_format)

log_file_path = LOG_DIR / LOG_FILE
file_handler = RotatingFileHandler(
    log_file_path,
    maxBytes=10 * 1024 * 1024,
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)
json_formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d'
)
file_handler.setFormatter(json_formatter)

error_file_handler = RotatingFileHandler(
    LOG_DIR / "error.log",
    maxBytes=10 * 1024 * 1024,
    backupCount=5
)
error_file_handler.setLevel(logging.ERROR)
error_file_handler.setFormatter(json_formatter)

logger.addHandler(console_handler)
logger.addHandler(file_handler)
logger.addHandler(error_file_handler)

def get_logger(name: str = None):
    if name:
        return logging.getLogger(f"starwars_api.{name}")
    return logger

