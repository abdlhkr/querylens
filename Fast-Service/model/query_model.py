from pydantic import BaseModel, field_validator


class QueryModel(BaseModel):
    """Veritabanı sorgu üretimi için giriş modeli."""

    db_type: str
    db_scheme: str
    question: str

    @field_validator("db_type", "db_scheme", "question")
    @classmethod
    def must_not_be_blank(cls, value: str, info) -> str:
        if not value or not value.strip():
            raise ValueError(f"{info.field_name} boş olamaz")
        return value.strip()
