"""Business layer for semantic SQL-cache lookups."""

import logging
from typing import Any, Optional

from .constants import DEFAULT_TOP_K, SIMILARITY_THRESHOLD
from .repository import ChromaSqlCacheRepository

logger = logging.getLogger(__name__)


class ChromaSqlCacheService:
    """Find and store SQL statements generated for natural-language questions."""

    def __init__(self, repository: Optional[ChromaSqlCacheRepository] = None) -> None:
        self._repository = repository or ChromaSqlCacheRepository()

    def find_cached_sql(self, question: str) -> dict[str, Any]:
        """Return a cache-hit payload when a matching SQL statement is found."""
        safe_miss: dict[str, Any] = {"found": False}
        result = self._repository.search_similar_question(question, DEFAULT_TOP_K)
        if not isinstance(result, dict):
            logger.info("Cache miss")
            return safe_miss

        try:
            document = self._first_value(result, "documents")
            distance = self._first_value(result, "distances")
            metadata = self._first_value(result, "metadatas")
            if not isinstance(document, str) or not isinstance(distance, (int, float)):
                logger.warning("Invalid ChromaDB query results")
                return safe_miss
            if not isinstance(metadata, dict):
                logger.warning("Corrupted metadata returned by ChromaDB")
                return safe_miss
            sql_query = metadata.get("sql_query")
            if not isinstance(sql_query, str) or not sql_query.strip():
                logger.warning("Missing SQL metadata in ChromaDB result")
                return safe_miss

            similarity = max(0.0, min(1.0, 1.0 - float(distance)))
            logger.info("Matched question: %s", document)
            logger.info("Similarity score: %.4f", similarity)
            if similarity < SIMILARITY_THRESHOLD:
                logger.info("Cache miss")
                return safe_miss

            logger.info("Cache hit")
            return {
                "found": True,
                "matched_question": document,
                "similarity": similarity,
                "sql_query": sql_query,
            }
        except (IndexError, KeyError, TypeError, ValueError):
            logger.exception("Invalid ChromaDB query results")
            return safe_miss

    def save_sql_cache(self, question: str, sql_query: str) -> bool:
        """Save a generated SQL statement unless its question already exists."""
        return self._repository.save_question_sql(question, sql_query)

    def get_total_records(self) -> int:
        """Return the number of cached question/SQL pairs."""
        return self._repository.get_total_records()

    @staticmethod
    def _first_value(result: dict[str, Any], key: str) -> Any:
        values = result.get(key)
        if not isinstance(values, list) or not values:
            raise ValueError(f"Missing {key} in ChromaDB result")
        first_row = values[0]
        if not isinstance(first_row, list) or not first_row:
            raise ValueError(f"Empty {key} in ChromaDB result")
        return first_row[0]
