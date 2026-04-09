from pydantic import BaseModel, field_validator


class FixQueryRequest(BaseModel):
    """Hatalı SQL sorgusunu düzeltmek için gerekli giriş verisi."""

    db_type: str
    db_scheme: str
    failed_query: str
    error_message: str
    question: str

    @field_validator("db_type", "db_scheme", "failed_query", "error_message", "question")
    @classmethod
    def must_not_be_blank(cls, value: str, info) -> str:
        if not value or not value.strip():
            raise ValueError(f"{info.field_name} boş olamaz")
        return value.strip()


class FixQueryResponse(BaseModel):
    """Düzeltilmiş SQL sorgusunu taşıyan yanıt modeli."""

    sql_query: str
