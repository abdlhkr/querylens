from typing import Any
import logging

logger = logging.getLogger(__name__)

from langchain_core.messages import HumanMessage, SystemMessage

from core.exceptions import LLMProviderError, QueryGenerationError
from schemas.query import QueryRequest
from services.llm_provider import get_llm

_SYSTEM_PROMPT_TEMPLATE = """
You are a SQL query generator.

Database type: {db_type}

Database schema:
{db_scheme}

STRICT RULES:
1. Generate ONLY a single SELECT statement.
2. The query MUST start with SELECT.
3. ALL table names in the query MUST be explicitly prefixed with their schema name (e.g., public.users instead of users).
4. The query MUST end with a semicolon (;).
5. DO NOT use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE.
6. DO NOT use comments (-- or /* */).
7. DO NOT include explanations.
8. DO NOT include markdown.
9. DO NOT include code fences.
10. DO NOT include any text before or after the query.
Output format:
SELECT ...;

"""


def _normalize_content(content: Any) -> str:
    """Ensure LLM output is returned as plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        # LangChain providers may return a list of chunks; join text parts only.
        text_parts = [part for part in content if isinstance(part, str)]
        if text_parts:
            return " ".join(text_parts)
    # Fallback: be explicit about unsupported payloads instead of silently casting.
    raise QueryGenerationError("LLM yanıtı metin formatında değil")


class QueryService:
    """SQL sorgusu üretmekten sorumlu servis katmanı."""

    def generate_query(self, request: QueryRequest) -> str:
        """
        Verilen istek modeline göre bir SQL SELECT sorgusu üretir.

        Returns:
            Üretilen SQL sorgu metni (str)

        Raises:
            LLMProviderError: LLM başlatılamazsa
            QueryGenerationError: Sorgu üretimi sırasında hata oluşursa
        """
        try:
            llm = get_llm()
        except LLMProviderError:
            raise

        logger.info(f"LLM'e gönderilecek db_scheme:\n{request.db_scheme}")

        messages = [
            SystemMessage(
                content=_SYSTEM_PROMPT_TEMPLATE.format(
                    db_type=request.db_type,
                    db_scheme=request.db_scheme,
                )
            ),
            HumanMessage(content=request.question),
        ]

        try:
            response = llm.invoke(messages)
            return _normalize_content(response.content)
        except Exception as exc:
            raise QueryGenerationError(
                f"SQL sorgusu üretilemedi: {exc}"
            ) from exc
