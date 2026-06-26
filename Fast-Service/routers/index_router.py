import asyncio
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from schemas.response import ApiResponse
from services import weaviate_service
from services.table_description_service import generate_description

router = APIRouter(prefix="/index", tags=["Index"])

# Açıklama üretiminde eşzamanlı LLM çağrısı sınırı (yüzlerce tabloda timeout olmasın).
_DESCRIPTION_CONCURRENCY = 5


class IndexTablePayload(BaseModel):
    """Tek bir tablonun Weaviate'e yazılacak metadata'sı."""

    schema_name: str = ""
    table_name: str = ""
    importance: float = 0.0
    row_count: int = 0
    column_count: int = 0
    content: str = ""
    schema_text: str = ""


class IndexTablesRequest(BaseModel):
    """db-service introspection sonrası gönderdiği indeksleme isteği."""

    database_id: str
    db_type: str | None = None
    tables: list[IndexTablePayload] = []


async def _enrich_with_descriptions(db_type: str, tables: list[dict]) -> list[dict]:
    """
    Her tablo için ayrı bir LLM çağrısıyla kısa bir 'purpose' açıklaması üretir ve
    Weaviate'e gitmeden önce `content`'e ekler. Çağrılar sınırlı eşzamanlılıkla
    paralel koşar; üretim başarısızsa o tablo açıklamasız geçer.
    """
    semaphore = asyncio.Semaphore(_DESCRIPTION_CONCURRENCY)

    async def enrich(table: dict) -> dict:
        async with semaphore:
            description = await asyncio.to_thread(
                generate_description, db_type, table.get("schema_text") or ""
            )
        if description:
            base = (table.get("content") or "").strip()
            table["content"] = (base + "\npurpose: " + description).strip()
        return table

    return await asyncio.gather(*(enrich(t) for t in tables))


@router.post(
    "/tables",
    summary="Tablo metadata'sını Weaviate'e indeksle",
    description="Bir veritabanının tablolarını (yeniden) indeksler; eski objeler silinip yenileri yazılır.",
)
async def index_tables(request: IndexTablesRequest) -> ApiResponse[dict[str, Any]]:
    tables = [t.model_dump() for t in request.tables]
    tables = await _enrich_with_descriptions(request.db_type or "", tables)
    count = weaviate_service.index_tables(request.database_id, tables)
    return ApiResponse.ok(data={"indexed": count})


@router.delete(
    "/{database_id}",
    summary="Bir veritabanının indeksini sil",
    description="DB silindiğinde Weaviate'teki tüm tablo objelerini temizler.",
)
async def delete_index(database_id: str) -> ApiResponse[dict[str, Any]]:
    weaviate_service.delete_database(database_id)
    return ApiResponse.ok(data={"deleted": database_id})
