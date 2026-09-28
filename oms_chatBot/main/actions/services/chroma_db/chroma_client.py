"""Thread-safe ChromaDB client and collection factory."""

import logging
import threading
from typing import Any, Optional

from .config import CHROMA_DB_PATH
from .constants import COLLECTION_NAME, DISTANCE_METRIC

logger = logging.getLogger(__name__)

_client: Optional[Any] = None
_collection: Optional[Any] = None
_client_lock = threading.Lock()


def get_client() -> Optional[Any]:
    """Return the shared persistent ChromaDB client, or ``None`` on failure."""
    global _client
    if _client is not None:
        return _client

    with _client_lock:
        if _client is not None:
            return _client
        try:
            import chromadb

            logger.info("Initializing ChromaDB at %s", CHROMA_DB_PATH)
            _client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
        except Exception:
            logger.exception("ChromaDB unavailable")
            return None
    return _client


def get_collection() -> Optional[Any]:
    """Return the SQL cache collection, creating it when necessary."""
    global _collection
    if _collection is not None:
        return _collection

    client = get_client()
    if client is None:
        return None

    with _client_lock:
        if _collection is not None:
            return _collection
        try:
            _collection = client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": DISTANCE_METRIC},
            )
            logger.info("Collection initialized: %s", COLLECTION_NAME)
        except Exception:
            logger.exception("Unable to initialize ChromaDB collection")
            return None
    return _collection
