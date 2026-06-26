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
    # Weaviate'ten seçilip LLM'e verilen şema; çağıran (db-service) self-heal
    # /fix isteğinde aynı şemayı kullansın diye geri döndürülür.
    dbScheme: str = ""


class UnavailableQueryResponse(BaseModel):
    type: Literal["unavailable"] = "unavailable"
    message: str
    suggestedQuestion: str
    analysis: AnalyzerOutput


class GeneralQueryResponse(BaseModel):
    type: Literal["general"] = "general"
    message: str
    analysis: AnalyzerOutput
