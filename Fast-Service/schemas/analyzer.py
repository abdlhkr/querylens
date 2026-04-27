from typing import Literal

from pydantic import BaseModel


class AnalyzerOutput(BaseModel):
    case: int
    reason: str
    rephrasedQuestion: str = ""
    userMessage: str = ""
    suggestedQuestion: str = ""


class SqlQueryResponse(BaseModel):
    type: Literal["sql"] = "sql"
    sql: str
    analysis: AnalyzerOutput


class UnavailableQueryResponse(BaseModel):
    type: Literal["unavailable"] = "unavailable"
    message: str
    suggestedQuestion: str
    analysis: AnalyzerOutput


class GeneralQueryResponse(BaseModel):
    type: Literal["general"] = "general"
    message: str
    analysis: AnalyzerOutput
