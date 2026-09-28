"""Configuration for the persistent ChromaDB SQL cache."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

CURRENT_DIR = Path(__file__).resolve().parent
CHROMA_DB_PATH = CURRENT_DIR / "storage"
try:
    CHROMA_DB_PATH.mkdir(parents=True, exist_ok=True)
except OSError:
    # The client factory handles this as an unavailable cache.  Importing Rasa
    # actions must never fail merely because the optional cache is unavailable.
    logger.exception("Unable to create ChromaDB storage directory: %s", CHROMA_DB_PATH)

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
