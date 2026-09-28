"""FastAPI service for cached SQL generation and result explanations."""

import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from langchain_ollama import ChatOllama
from pydantic import BaseModel, Field

# Uvicorn starts this module from its own directory.  Import the cache through
# ``services`` rather than ``actions.services`` so Python does not execute the
# Rasa-only actions package (and therefore does not require rasa_sdk in ui_venv).
PROJECT_ROOT = Path(__file__).resolve().parents[4]
SERVICES_ROOT = PROJECT_ROOT / "actions"
if str(SERVICES_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICES_ROOT))

from services.chroma_db.service import ChromaSqlCacheService

logger = logging.getLogger(__name__)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/")
DEBUG_CACHE = os.getenv("SQL_CACHE_DEBUG", "true").lower() == "true"


def _debug(message: str) -> None:
    """Print concise cache diagnostics when SQL_CACHE_DEBUG is enabled."""
    if DEBUG_CACHE:
        print(f"[SQL CACHE DEBUG] {message}", flush=True)


class SQLGenerationRequest(BaseModel):
    """Payload accepted by the SQL generation endpoint."""

    prompt: str = Field(..., min_length=1)
    question: str | None = Field(default=None, min_length=1)


class ExplanationRequest(BaseModel):
    """Payload accepted by the explanation endpoint."""

    prompt_expl: str = Field(..., min_length=1)


class CacheSearchRequest(BaseModel):
    """Payload accepted by the cache debugging endpoint."""

    question: str = Field(..., min_length=1)



def print_cache_result(
    user_question: str,
    found: bool,
    similarity: float = 0.0,
    matched_question: str = "",
    sql_query: str = ""
) -> None:

    print("\n" + "=" * 70)
    print("                 CHROMADB CACHE SEARCH")
    print("=" * 70)

    print(f"\nUSER QUESTION:\n{user_question}")

    if matched_question:
        print(f"\nMATCHED QUESTION:\n{matched_question}")

    print(f"\nSIMILARITY:\n{similarity * 100:.2f}%")

    print("\nTHRESHOLD:\n70.00%")

    if found:
        print("\nCACHE RESULT:")
        print("✅ CACHE HIT")

        print("\nRETURNING SQL:")
        print(sql_query)

    else:
        print("\nCACHE RESULT:")
        print("❌ CACHE MISS")

        print("\nACTION:")
        print("Calling Ollama")

    print("\n" + "=" * 70)


def _create_llm(model_name: str) -> ChatOllama:
    """Create a shared Ollama model with the service's standard settings."""
    return ChatOllama(
        model=model_name,
        base_url=OLLAMA_BASE_URL,
        temperature=0,
        num_predict=512,
        num_ctx=2048,
        keep_alive="30m",
        extra_body={"think": False},
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialize reusable LLM and ChromaDB services once at startup."""
    logger.info("Initializing SQL generation service dependencies")
    app.state.sql_llm = _create_llm("deepseek-coder:6.7b")
    app.state.exp_llm = _create_llm("llama3:8b")     
    app.state.sql_model_q = _create_llm("qwen2.5-coder:3b")
    app.state.exp_llm_q = _create_llm("gemma3:1b")
    app.state.chroma_service = ChromaSqlCacheService()
    _debug("FastAPI started. Shared Ollama models and ChromaDB service are ready.")
    yield


app = FastAPI(lifespan=lifespan)


def _get_chroma_service(request: Request) -> ChromaSqlCacheService:
    """Return the shared cache service initialized during application startup."""
    return request.app.state.chroma_service


@app.post("/generate-sql")
def generate(request: SQLGenerationRequest, app_request: Request) -> dict[str, Any]:
    """Return cached SQL when available, otherwise generate it with Ollama."""
    logger.info("Received SQL generation request")
    cache_service = _get_chroma_service(app_request)
    cache_key = request.question or request.prompt
    _debug(f"Incoming cache key: {cache_key!r}")

    try:
        logger.info("Searching ChromaDB cache")
        _debug("Step 1/4: searching ChromaDB.")
        cache_result = cache_service.find_cached_sql(cache_key)
        if cache_result.get("found"):

            logger.info("Cache hit; returning cached SQL")

            print("\n" + "=" * 80)
            print("                     CHROMADB CACHE HIT")
            print("=" * 80)

            print(f"\nUSER QUESTION:")
            print(f"{cache_key}")

            print(f"\nMATCHED QUESTION:")
            print(f"{cache_result['matched_question']}")

            print(f"\nSIMILARITY SCORE:")
            print(f"{cache_result['similarity'] * 100:.2f}%")

            print(f"\nTHRESHOLD:")
            print("70.00%")

            print(f"\nCACHE DECISION:")
            print("✅ CACHE HIT")

            print(f"\nRETURNING SQL:")
            print(cache_result["sql_query"])

            print("\n" + "=" * 80 + "\n")

            _debug(
                "CACHE HIT | "
                f"similarity={cache_result['similarity']:.4f} | "
                f"matched={cache_result['matched_question']!r}"
            )

            _debug(
                "Step 2/4: Ollama skipped. Returning cached SQL."
            )

            return {
                "sql": cache_result["sql_query"],
                "source": "cache",
                "similarity": cache_result["similarity"],
            }
        logger.info("Cache miss")

        print("\n" + "=" * 80)
        print("                     CHROMADB CACHE MISS")
        print("=" * 80)

        print(f"\nUSER QUESTION:")
        print(f"{cache_key}")

        if cache_result.get("matched_question"):
            print(f"\nBEST MATCH:")
            print(f"{cache_result['matched_question']}")

        if cache_result.get("similarity"):
            print(f"\nSIMILARITY SCORE:")
            print(f"{cache_result['similarity'] * 100:.2f}%")

        print(f"\nTHRESHOLD:")
        print("70.00%")

        print(f"\nCACHE DECISION:")
        print("❌ CACHE MISS")

        print(f"\nACTION:")
        print("Calling Ollama for SQL Generation")

        print("\n" + "=" * 80 + "\n")

        _debug(
            "CACHE MISS | similarity is below 0.70 or cache has no match."
        )
        _debug("CACHE MISS | similarity is below 0.70 or cache has no match.")
    except Exception:
        logger.exception("ChromaDB lookup failed; continuing with Ollama")
        _debug("CACHE ERROR | continuing with Ollama; see traceback above.")

    try:
        logger.info("Calling Ollama")
        _debug("Step 2/4: calling Ollama to generate SQL.")
        started_at = time.monotonic()
        response = app_request.app.state.sql_llm.invoke(request.prompt)
        generated_sql = response.content.strip()
        if not generated_sql:
            raise ValueError("Ollama returned an empty SQL response")
        logger.info("Ollama SQL generation completed in %.2f seconds", time.monotonic() - started_at)
        _debug(f"Ollama generated SQL: {generated_sql!r}")
    except Exception as exc:
        logger.exception("SQL generation with Ollama failed")
        raise HTTPException(status_code=502, detail="SQL generation service is unavailable") from exc

    try:
        logger.info("Saving generated SQL to cache")
        _debug("Step 3/4: saving question and generated SQL to ChromaDB.")
        saved = cache_service.save_sql_cache(cache_key, generated_sql)
        _debug(f"Cache save completed | saved={saved}")
    except Exception:
        logger.exception("Unable to save generated SQL to ChromaDB cache")
        _debug("CACHE SAVE ERROR | SQL is still returned to Rasa.")

    logger.info("Returning generated SQL")
    _debug("Step 4/4: returning LLM SQL to Rasa | source=llm")
    return {"sql": generated_sql, "source": "llm"}


@app.get("/cache-stats")
def cache_stats(app_request: Request) -> dict[str, int]:
    """Return the number of question/SQL pairs persisted in the cache."""
    try:
        total = _get_chroma_service(app_request).get_total_records()
        _debug(f"Cache statistics requested | total_cached_questions={total}")
        return {"total_cached_questions": total}
    except Exception:
        logger.exception("Unable to retrieve ChromaDB cache statistics")
        return {"total_cached_questions": 0}


@app.post("/cache-search")
def cache_search(
    request: CacheSearchRequest, app_request: Request
) -> dict[str, Any]:
    """Search the SQL cache for debugging without invoking Ollama."""
    try:
        logger.info("Searching ChromaDB cache")
        _debug(f"Manual cache search | question={request.question!r}")
        result = _get_chroma_service(app_request).find_cached_sql(request.question)
        _debug(f"Manual cache search result | found={result.get('found')}")
        return result
    except Exception:
        logger.exception("ChromaDB cache search failed")
        return {"found": False}


@app.post("/explian-result")
def explain(request: ExplanationRequest, app_request: Request) -> dict[str, str]:
    """Generate a natural-language explanation of SQL execution results."""
    try:
        print(f"\nCalling LLM ({app_request.app.state.exp_llm_q.model}) for result explanation\n")
        response = app_request.app.state.exp_llm_q.invoke(request.prompt_expl)    # previously i used main - 'exp_llm', quantized - 'exp_llm_q'
        print("\n\n\n\nTHIS IS THE RESULT GOT BY EXPLAINATION FROM LLM :- ",response.content,"\n\n\n\n")
        print("=" * 100)
        print("TYPE:", type(response))
        print("RAW RESPONSE:", response)
        print("CONTENT REPR:", repr(response.content))
        print("=" * 100)
        return {"explaination": response.content.strip()}
    except Exception as exc:
        logger.exception("Result explanation with Ollama failed")
        raise HTTPException(status_code=502, detail="Explanation service is unavailable") from exc
