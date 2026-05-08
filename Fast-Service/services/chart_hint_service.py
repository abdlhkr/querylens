import json
import logging
import re
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from core.exceptions import LLMProviderError, QueryGenerationError
from schemas.chart import ChartRecommendRequest, ChartRecommendResponse
from services.llm_provider import get_llm

logger = logging.getLogger(__name__)

_CHART_SYSTEM_PROMPT = """You are a data visualization advisor.

Given a user's question, column names, and sample rows from a SQL result set, choose the best chart type and axis fields.

Supported chart types: bar, line, pie, area

Rules:
- "keyField" is the categorical or temporal column used as the x-axis label (e.g. date, month, name, region, category).
- "valueFields" is a list of one or more numeric columns to plot on the y-axis.
- If a column is a meaningless primary key (uuid, auto-increment id) and a better label column exists, prefer the label column as keyField.
- For time-series data (columns containing date, month, year, week, time in the name or value): prefer "line" or "area".
- For comparisons across discrete categories: prefer "bar".
- For part-to-whole relationships with a single value field and few categories (≤ 8): prefer "pie".
- Use "area" when trend over time AND cumulative magnitude both matter.
- Return only valid JSON. Do not include markdown. Do not include explanations outside the JSON object.

JSON format:
{
  "chartType": "bar" | "line" | "pie" | "area",
  "keyField": "<one column name from the provided columns>",
  "valueFields": ["<column name>", ...],
  "reason": "<one sentence explanation>"
}
"""


def _normalize_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [p for p in content if isinstance(p, str)]
        if parts:
            return " ".join(parts)
    raise QueryGenerationError("LLM yanıtı metin formatında değil")


def _strip_fences(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


class ChartHintService:

    def recommend(self, request: ChartRecommendRequest) -> ChartRecommendResponse:
        try:
            llm = get_llm()
        except LLMProviderError:
            raise

        trimmed_rows = request.sample_rows[:5]
        sample_text = json.dumps(trimmed_rows, ensure_ascii=False, default=str)

        human_content = (
            f"User question: {request.question}\n"
            f"Columns: {json.dumps(request.columns)}\n"
            f"Sample rows (up to 5): {sample_text}"
        )

        messages = [
            SystemMessage(content=_CHART_SYSTEM_PROMPT),
            HumanMessage(content=human_content),
        ]

        try:
            response = llm.invoke(messages)
            raw = _normalize_content(response.content)
            cleaned = _strip_fences(raw)
            result = ChartRecommendResponse.model_validate(json.loads(cleaned))
            logger.info(
                "Chart recommendation: type=%s key=%s values=%s",
                result.chartType, result.keyField, result.valueFields,
            )
            return result
        except (json.JSONDecodeError, ValueError) as exc:
            raise QueryGenerationError(f"Chart LLM yanıtı geçerli JSON değil: {exc}") from exc
        except Exception as exc:
            raise QueryGenerationError(f"Grafik önerisi başarısız: {exc}") from exc
