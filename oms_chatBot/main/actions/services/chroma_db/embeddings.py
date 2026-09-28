"""Lazy, thread-safe access to the sentence-transformer embedding model."""

import logging
import threading
from typing import Any, Optional, Sequence

from .config import EMBEDDING_MODEL_NAME

logger = logging.getLogger(__name__)

_model: Optional[Any] = None
_model_lock = threading.Lock()


def get_embedding_model() -> Optional[Any]:
    """Return the shared embedding model, or ``None`` when it cannot load."""
    global _model

    if _model is not None:
        return _model

    with _model_lock:
        if _model is not None:
            return _model

        try:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading embedding model: %s", EMBEDDING_MODEL_NAME)
            _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        except Exception:
            logger.exception("Embedding model load failure")
            return None

    return _model


def create_embeddings(texts: Sequence[str]) -> Optional[list[list[float]]]:
    """Create embeddings for text values, returning ``None`` on failure."""
    if not texts or any(not isinstance(text, str) or not text.strip() for text in texts):
        logger.warning("Embedding generation skipped because input text is invalid")
        return None

    model = get_embedding_model()
    if model is None:
        return None

    try:
        vectors = model.encode(list(texts), normalize_embeddings=True)
        return [[float(value) for value in vector] for vector in vectors]
    except Exception:
        logger.exception("Embedding generation failed")
        return None
