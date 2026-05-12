import json
import logging
import re
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from core.exceptions import LLMProviderError, QueryGenerationError
from schemas.analyzer import AnalyzerOutput
from services.llm_provider import get_llm

logger = logging.getLogger(__name__)

_ANALYZER_SYSTEM_PROMPT = """You are a database question analyzer.

Your job is to decide whether the user's question can be answered using the given database schema.

You must classify the question into exactly one of these cases:

CASE 1:
The question can be answered using the database schema.

CASE 2:
The question is related to the database, but the required table or column does not exist in the schema. 
Or The user is asking to understand, explain, summarize, explore, or get example questions about the database/schema itself. This does not require SQL generation.

CASE 3:
The question is not related to the database at all (general knowledge, geography, science, etc.).

Database type:
{dbType}

Database schema:
{dbSchema}

Rules:
- Do not generate SQL.
- Never invent tables or columns.
- Only choose CASE 1 if the answer can be produced using existing tables and columns.
- If any required data is missing from the schema, choose CASE 2.
- If the question is general knowledge or unrelated to the database, choose CASE 3.
- Use the same language as the user's question for ALL text fields (rephrasedQuestion, userMessage, suggestedQuestion).
- Return only valid JSON.
- Do not include markdown.
- Do not include explanations outside JSON.

For CASE 3 userMessage:
- First, provide a complete and correct answer to the user's question in the same language they used.
- Then, on a new line, add exactly this note in the user's language:
  Turkish: "Bu yanıt veritabanınızdan bağımsızdır."
  English: "This answer is independent of your database."
  (use whichever matches the user's language)
- Do NOT just say "this is unrelated to the database" — actually answer the question.

For CASE 2 userMessage:
- Explain which specific data is missing from the schema in the user's language.
- Do not use words from languages other than the user's language.

JSON format:
{{
  "case": 1 | 2 | 3,
  "reason": "short reason",
  "rephrasedQuestion": "clearer version of the question if case 1, otherwise empty string",
  "userMessage": "for case 3: full answer + independence note. for case 2: explanation of missing data. for case 1: empty string",
  "suggestedQuestion": "suggested database-answerable question if case 2, otherwise empty string"
}}
"""


def _normalize_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = [part for part in content if isinstance(part, str)]
        if text_parts:
            return " ".join(text_parts)
    raise QueryGenerationError("LLM yanıtı metin formatında değil")


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` wrappers if the LLM adds them despite instructions."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


class AnalyzerService:
    """Analyzes whether a user question can be answered from the given DB schema."""

    def analyze(self, question: str, db_type: str, db_scheme: str) -> AnalyzerOutput:
        try:
            llm = get_llm()
        except LLMProviderError:
            raise

        logger.info("Analyzing question: %s", question)

        messages = [
            SystemMessage(
                content=_ANALYZER_SYSTEM_PROMPT.format(
                    dbType=db_type,
                    dbSchema=db_scheme,
                )
            ),
            HumanMessage(content=question),
        ]

        try:
            response = llm.invoke(messages)
            raw_text = _normalize_content(response.content)
            cleaned = _strip_markdown_fences(raw_text)
            result = AnalyzerOutput.model_validate(json.loads(cleaned))
            logger.info("Analyzer classified question as CASE %d: %s", result.case, result.reason)
            return result
        except (json.JSONDecodeError, ValueError) as exc:
            raise QueryGenerationError(
                f"Analyzer LLM yanıtı geçerli JSON değil: {exc}"
            ) from exc
        except Exception as exc:
            raise QueryGenerationError(
                f"Soru analizi başarısız: {exc}"
            ) from exc
