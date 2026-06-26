"""
Weaviate katmanı: kullanıcı veritabanı tablolarının metadata'sını indeksler ve
sorulan soruya göre hybrid search ile en alakalı tabloları getirir.

Akış:
- index_tables(...): db-service introspection bittiğinde her tablo için bir obje
  yazar. `content` (ad + kolonlar + FK) text2vec-openai ile vektörlenir; `schema_text`
  (LLM'e verilecek kolon-tipli blok) vektörlenmez, sadece saklanır.
- search_tables(...): hybrid search ile `candidates` aday tablo çeker, importance'a
  göre yeniden sıralar, ilk `top` tablonun `schema_text`'ini birleştirip db_scheme döner.

Embedding'i Weaviate'in kendisi (text2vec-openai modülü) üretir; OpenAI anahtarı
istek başlığıyla iletilir.
"""

import logging
import os

import weaviate
from weaviate.classes.config import Configure, DataType, Property
from weaviate.classes.data import DataObject
from weaviate.classes.init import AdditionalConfig, Timeout
from weaviate.classes.query import Filter

logger = logging.getLogger(__name__)

COLLECTION_NAME = "DbTable"

# Hybrid search ağırlığı: 0.0 = saf BM25 (kelime), 1.0 = saf vektör. Tuning için tek nokta.
HYBRID_ALPHA = 0.5

_WEAVIATE_HOST = os.getenv("WEAVIATE_HOST", "weaviate")
_WEAVIATE_HTTP_PORT = int(os.getenv("WEAVIATE_HTTP_PORT", "8080"))
_WEAVIATE_GRPC_PORT = int(os.getenv("WEAVIATE_GRPC_PORT", "50051"))

_client: weaviate.WeaviateClient | None = None


def get_client() -> weaviate.WeaviateClient:
    """Lazy singleton Weaviate client. Bağlantı ilk çağrıda kurulur."""
    global _client
    if _client is None or not _client.is_connected():
        api_key = os.getenv("OPENAI_API_KEY", "")
        _client = weaviate.connect_to_custom(
            http_host=_WEAVIATE_HOST,
            http_port=_WEAVIATE_HTTP_PORT,
            http_secure=False,
            grpc_host=_WEAVIATE_HOST,
            grpc_port=_WEAVIATE_GRPC_PORT,
            grpc_secure=False,
            headers={"X-OpenAI-Api-Key": api_key},
            # Hybrid search sorgu metnini OpenAI ile vektörleştirir; OpenAI'ın yavaş
            # anlarında varsayılan 30sn deadline aşılıp DEADLINE_EXCEEDED olmasın diye
            # timeout'lara pay bırak. insert daha uzun (indexleme çok embedding üretir).
            additional_config=AdditionalConfig(
                timeout=Timeout(query=60, insert=180, init=30)
            ),
        )
        logger.info("Weaviate client connected (%s:%s)", _WEAVIATE_HOST, _WEAVIATE_HTTP_PORT)
    return _client


def close_client() -> None:
    """Uygulama kapanışında bağlantıyı kapatır."""
    global _client
    if _client is not None:
        try:
            _client.close()
        finally:
            _client = None


def ensure_collection() -> None:
    """`DbTable` koleksiyonunu yoksa oluşturur. Startup'ta çağrılır."""
    client = get_client()
    if client.collections.exists(COLLECTION_NAME):
        logger.info("Weaviate collection '%s' already exists", COLLECTION_NAME)
        return

    client.collections.create(
        name=COLLECTION_NAME,
        vectorizer_config=Configure.Vectorizer.text2vec_openai(),
        properties=[
            Property(name="database_id", data_type=DataType.TEXT, skip_vectorization=True),
            Property(name="schema_name", data_type=DataType.TEXT, skip_vectorization=True),
            Property(name="table_name", data_type=DataType.TEXT, skip_vectorization=True),
            Property(name="importance", data_type=DataType.NUMBER),
            Property(name="row_count", data_type=DataType.INT),
            Property(name="column_count", data_type=DataType.INT),
            # Vektörlenen doküman (ad + kolon adları + FK + varsa açıklama)
            Property(name="content", data_type=DataType.TEXT),
            # LLM'e verilecek hazır blok; aramaya katılmaz
            Property(name="schema_text", data_type=DataType.TEXT, skip_vectorization=True),
        ],
    )
    logger.info("Weaviate collection '%s' created", COLLECTION_NAME)


def index_tables(database_id: str, tables: list[dict]) -> int:
    """
    Bir veritabanının tablolarını (yeniden) indeksler: önce o database_id'ye ait
    eski objeleri siler, sonra gelen tabloları toplu yazar. Yazılan obje sayısını döner.
    """
    # Koleksiyon kaybolmuşsa (Weaviate restart/volume reset) kendi kendine onar.
    ensure_collection()

    client = get_client()
    coll = client.collections.get(COLLECTION_NAME)

    coll.data.delete_many(where=Filter.by_property("database_id").equal(database_id))

    if not tables:
        return 0

    objects = [
        DataObject(
            properties={
                "database_id": database_id,
                "schema_name": t.get("schema_name") or "",
                "table_name": t.get("table_name") or "",
                "importance": float(t.get("importance") or 0.0),
                "row_count": int(t.get("row_count") or 0),
                "column_count": int(t.get("column_count") or 0),
                "content": t.get("content") or "",
                "schema_text": t.get("schema_text") or "",
            }
        )
        for t in tables
    ]

    result = coll.data.insert_many(objects)
    if result.has_errors:
        logger.error("Weaviate insert errors for db %s: %s", database_id, result.errors)
    logger.info("Indexed %d tables for database %s", len(objects), database_id)
    return len(objects)


def delete_database(database_id: str) -> None:
    """Bir veritabanına ait tüm tablo objelerini siler (DB silindiğinde)."""
    client = get_client()
    coll = client.collections.get(COLLECTION_NAME)
    coll.data.delete_many(where=Filter.by_property("database_id").equal(database_id))
    logger.info("Deleted Weaviate objects for database %s", database_id)


def search_tables(database_id: str, question: str, candidates: int = 30, top: int = 10) -> str:
    """
    Soruya göre hybrid search yapar (database_id ile filtrelenmiş), `candidates`
    aday tablo çeker, importance'a göre azalan sıralar ve ilk `top` tablonun
    `schema_text`'lerini birleştirip db_scheme metnini döner. Sonuç yoksa "".
    """
    client = get_client()

    # Koleksiyon yoksa (henüz hiç indeksleme olmadı / Weaviate sıfırlandı) 500 yerine
    # boş dön; router bunu "şema indekslenmedi" (400) mesajına çevirir.
    if not client.collections.exists(COLLECTION_NAME):
        logger.warning("Weaviate collection '%s' yok; arama boş dönüyor", COLLECTION_NAME)
        return ""

    coll = client.collections.get(COLLECTION_NAME)

    response = coll.query.hybrid(
        query=question,
        alpha=HYBRID_ALPHA,
        filters=Filter.by_property("database_id").equal(database_id),
        limit=candidates,
        return_properties=["schema_text", "importance", "table_name"],
    )

    objects = list(response.objects)
    if not objects:
        return ""

    objects.sort(key=lambda o: o.properties.get("importance") or 0.0, reverse=True)
    selected = objects[:top]

    logger.info(
        "Hybrid search for db %s returned %d candidates; using top %d tables: %s",
        database_id,
        len(objects),
        len(selected),
        [o.properties.get("table_name") for o in selected],
    )

    blocks = [
        o.properties.get("schema_text")
        for o in selected
        if o.properties.get("schema_text")
    ]
    return "\n".join(blocks)


def _to_rows(objects) -> list[dict]:
    """Weaviate objelerini hafif dict'lere indirger (schema_completion ajanının kullandığı format)."""
    rows = []
    for o in objects:
        props = o.properties
        rows.append(
            {
                "schema_name": props.get("schema_name") or "",
                "table_name": props.get("table_name") or "",
                "schema_text": props.get("schema_text") or "",
            }
        )
    return rows


def find_tables_by_name(database_id: str, table_name: str, limit: int = 5) -> list[dict]:
    """
    Tablo adına göre (fuzzy) arama yapar. schema_completion ajanı, RAG'in kaçırdığı
    bir tabloyu adıyla bulmak için kullanır. Koleksiyon yoksa [] döner.
    """
    client = get_client()
    if not client.collections.exists(COLLECTION_NAME):
        return []

    coll = client.collections.get(COLLECTION_NAME)
    response = coll.query.fetch_objects(
        filters=Filter.all_of([
            Filter.by_property("database_id").equal(database_id),
            Filter.by_property("table_name").like(f"*{table_name}*"),
        ]),
        limit=limit,
        return_properties=["schema_name", "table_name", "schema_text"],
    )
    return _to_rows(response.objects)


def find_tables_by_column(database_id: str, column_name: str, limit: int = 5) -> list[dict]:
    """
    Verilen ada sahip kolonu içeren tabloları bulur. `content` alanı tablo kolon
    adlarını ('columns: id, name, ...') taşıdığından onun üzerinde like filtresi
    uygular. Koleksiyon yoksa [] döner.
    """
    client = get_client()
    if not client.collections.exists(COLLECTION_NAME):
        return []

    coll = client.collections.get(COLLECTION_NAME)
    response = coll.query.fetch_objects(
        filters=Filter.all_of([
            Filter.by_property("database_id").equal(database_id),
            Filter.by_property("content").like(f"*{column_name}*"),
        ]),
        limit=limit,
        return_properties=["schema_name", "table_name", "schema_text"],
    )
    return _to_rows(response.objects)


def get_schema_text_for_tables(database_id: str, table_names: list[str]) -> list[dict]:
    """
    Verilen tablo adları için schema_text bloklarını çeker (final birleştirme için).
    `schema.table` biçimindeki adların son parçası (tablo adı) eşleştirmede kullanılır.
    Koleksiyon yoksa veya isim listesi boşsa [] döner.
    """
    if not table_names:
        return []

    client = get_client()
    if not client.collections.exists(COLLECTION_NAME):
        return []

    bare_names = [name.split(".")[-1] for name in table_names if name]
    if not bare_names:
        return []

    coll = client.collections.get(COLLECTION_NAME)
    response = coll.query.fetch_objects(
        filters=Filter.all_of([
            Filter.by_property("database_id").equal(database_id),
            Filter.by_property("table_name").contains_any(bare_names),
        ]),
        limit=len(bare_names) + 50,
        return_properties=["schema_name", "table_name", "schema_text"],
    )
    return _to_rows(response.objects)
