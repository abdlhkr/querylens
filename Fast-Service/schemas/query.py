from pydantic import BaseModel, field_validator


class QueryRequest(BaseModel):
    """
    SQL sorgusu üretmek için gerekli giriş verisi.

    Şema artık istekle gelmiyor; fast-service `database_id` ile Weaviate'ten
    soruya en alakalı tabloları kendisi seçer.
    """

    db_type: str
    database_id: str
    question: str

    @field_validator("db_type", "database_id", "question")
    @classmethod
    def must_not_be_blank(cls, value: str, info) -> str:
        if not value or not value.strip():
            raise ValueError(f"{info.field_name} boş olamaz")
        return value.strip()


class QueryResponse(BaseModel):
    """Üretilen SQL sorgusunu taşıyan yanıt modeli."""

    sql_query: str
