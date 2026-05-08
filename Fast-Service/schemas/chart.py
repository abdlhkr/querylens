from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, field_validator


class ChartRecommendRequest(BaseModel):
    question: str
    columns: List[str]
    sample_rows: List[dict]

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("question cannot be blank")
        return v.strip()

    @field_validator("columns")
    @classmethod
    def columns_not_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("columns cannot be empty")
        return v


class ChartRecommendResponse(BaseModel):
    chartType: Literal["bar", "line", "pie", "area"]
    keyField: str
    valueFields: List[str]
    reason: str
