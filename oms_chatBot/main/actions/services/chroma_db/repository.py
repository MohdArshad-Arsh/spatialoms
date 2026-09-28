"""Data-access operations for the ChromaDB SQL cache."""

import logging
from typing import Any, Optional
from uuid import uuid4

from .chroma_client import get_collection
from .embeddings import create_embeddings

logger = logging.getLogger(__name__)


class ChromaSqlCacheRepository:
    """Persist and retrieve question/SQL pairs without business decisions."""

    def __init__(self, collection: Optional[Any] = None) -> None:
        self._collection = collection

    def _get_collection(self) -> Optional[Any]:
        """Return the injected collection or obtain the default collection."""
        return self._collection if self._collection is not None else get_collection()

    def save_question_sql(self, question: str, sql_query: str) -> bool:
        """Store a new question and SQL query. Returns whether it was saved."""
        if not self._is_valid_text(question) or not self._is_valid_text(sql_query):
            logger.warning("Skipping cache save because question or SQL is empty")
            return False
        if self.question_exists(question):
            logger.info("Question already exists in cache")
            return False

        collection = self._get_collection()
        embeddings = create_embeddings([question])
        if collection is None or embeddings is None:
            return False

        try:
            logger.info("Saving SQL cache")
            collection.add(
                ids=[str(uuid4())],
                documents=[question],
                metadatas=[{"question": question, "sql_query": sql_query}],
                embeddings=embeddings,
            )
            return True
        except Exception:
            logger.exception("ChromaDB insert failed")
            return False

    def search_similar_question(
        self, question: str, top_k: int = 1
    ) -> Optional[dict[str, Any]]:
        """Return ChromaDB's nearest-question response, or ``None`` on failure."""
        if not self._is_valid_text(question) or top_k < 1:
            return None
        collection = self._get_collection()
        if collection is None or self.get_total_records() == 0:
            return None
        embeddings = create_embeddings([question])
        if embeddings is None:
            return None

        try:
            logger.info("Searching cache")
            return collection.query(
                query_embeddings=embeddings,
                n_results=top_k,
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            logger.exception("ChromaDB query failed")
            return None

    def question_exists(self, question: str) -> bool:
        """Return whether the exact question has already been cached."""
        if not self._is_valid_text(question):
            return False
        collection = self._get_collection()
        if collection is None:
            return False
        try:
            result = collection.get(where={"question": question}, include=[])
            return bool(result and result.get("ids"))
        except Exception:
            logger.exception("Unable to check whether question exists in cache")
            return False

    def get_total_records(self) -> int:
        """Return the cache record count, or zero when unavailable."""
        collection = self._get_collection()
        if collection is None:
            return 0
        try:
            return int(collection.count())
        except Exception:
            logger.exception("Unable to count ChromaDB records")
            return 0

    @staticmethod
    def _is_valid_text(value: object) -> bool:
        return isinstance(value, str) and bool(value.strip())
