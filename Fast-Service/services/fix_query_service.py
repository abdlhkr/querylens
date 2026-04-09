from typing import Any
import logging

logger = logging.getLogger(__name__)

from langchain_core.messages import HumanMessage, SystemMessage

from core.exceptions import LLMProviderError, QueryGenerationError
from schemas.fix_query import FixQueryRequest
from services.llm_provider import get_llm

_FIX_SYSTEM_PROMPT_TEMPLATE = """
You are a SQL query fixer.

Database type: {db_type}

Database schema:
{db_scheme}

The following SQL query was generated but failed during execution:

Failed Query:
{failed_query}

Error message:
{error_message}

Original user question:
{question}

STRICT RULES:
1. Fix ONLY the SQL query based on the error message and the database schema.
2. Generate ONLY a single SELECT statement.
3. The query MUST start with SELECT.
4. ALL table names in the query MUST be explicitly prefixed with their schema name (e.g., public.users instead of users).
5. The query MUST end with a semicolon (;).
6. DO NOT use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE.
7. DO NOT use comments (-- or /* */).
8. DO NOT include explanations.
9. DO NOT include markdown.
10. DO NOT include code fences.
11. DO NOT include any text before or after the query.
Output format:
SELECT ...;

"""


def _normalize_content(content: Any) -> str:
    """Ensure LLM output is returned as plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = [part for part in content if isinstance(part, str)]
        if text_parts:
            return " ".join(text_parts)
    raise QueryGenerationError("LLM yanıtı metin formatında değil")


class FixQueryService:
    """Hatalı SQL sorgusunu düzeltmekten sorumlu servis katmanı."""

    def fix_query(self, request: FixQueryRequest) -> str:
        """
        Hatalı SQL sorgusunu LLM aracılığıyla düzeltir.

        Returns:
            Düzeltilmiş SQL sorgu metni (str)

        Raises:
            LLMProviderError: LLM başlatılamazsa
            QueryGenerationError: Düzeltme sırasında hata oluşursa
        """
        try:
            llm = get_llm()
        except LLMProviderError:
            raise

        logger.info(
            "SQL düzeltme isteniyor. Hatalı sorgu: %s | Hata: %s",
            request.failed_query,
            request.error_message,
        )

        messages = [
            SystemMessage(
                content=_FIX_SYSTEM_PROMPT_TEMPLATE.format(
                    db_type=request.db_type,
                    db_scheme=request.db_scheme,
                    failed_query=request.failed_query,
                    error_message=request.error_message,
                    question=request.question,
                )
            ),
            HumanMessage(
                content=f"Fix the failed SQL query. Error: {request.error_message}"
            ),
        ]

        try:
            response = llm.invoke(messages)
            fixed_sql = _normalize_content(response.content)
            logger.info("LLM düzeltilmiş SQL: %s", fixed_sql)
            return fixed_sql
        except Exception as exc:
            raise QueryGenerationError(
                f"SQL sorgusu düzeltilemedi: {exc}"
            ) from exc
