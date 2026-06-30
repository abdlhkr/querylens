"""
Middle "schema-completion" agent.

RAG (weaviate_service.search_tables) ile getirilen şema bağlamının soruyu yanıtlamaya
yeterli olup olmadığını doğrular. Eksik görünüyorsa, araçlarla (tablo adı / kolon adı)
indekslenmiş şemada arama yapıp bağlamı zenginleştirir. SQL YAZMAZ; yalnızca son LLM'e
verilecek temiz ve eksiksiz şema bağlamını (tablolar + kolonlar + ilişkiler) hazırlar.

Akış:
- Ajan, RAG şemasını + soruyu görür; bind_tools ile araç çağırabilir.
- Sınırlı bir döngüde araç çağrılarını çalıştırır, sonuçları geri besler.
- Sonunda gereken tabloların tam adlarını (schema.table) JSON dizisi olarak verir.
- Kod, bu tabloların schema_text bloklarını Weaviate'ten deterministik olarak yeniden
  kurar (LLM son şema metnini üretmez).

Dayanıklılık: herhangi bir hata veya boş sonuçta orijinal RAG şeması olduğu gibi
döner; böylece pipeline asla gerilemez. SCHEMA_COMPLETION_ENABLED=false ile kapatılır.
"""

import json
import logging
import os
import re

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool

from services import weaviate_service
from services.llm_provider import get_llm

logger = logging.getLogger(__name__)

# Araç çağrısı / LLM tur sayısı üst sınırı (sonsuz döngü ve aşırı gecikmeyi önler).
_MAX_ITERATIONS = 8

_SYSTEM_PROMPT = """You are a database schema-completion agent.

Your job: decide the MINIMAL set of tables required to answer the user's question.
You start from a retrieved (RAG) schema context and may use tools to discover tables
that are missing from it. You do NOT write SQL.

Database type: {db_type}

Retrieved schema context:
{rag_scheme}

How to work:
- Explore broadly, output narrowly. You may search proactively to confirm join paths
  and find missing tables, but your FINAL answer must list ONLY the tables actually
  needed to answer the question — not every table you looked at.
- Do not rely on foreign keys alone. If FKs are missing or incomplete, use shared
  column names, naming conventions, and domain knowledge of the database type
  (ERP/CRM/accounting/inventory/sales/HR systems often split data across
  header/line and master/lookup tables) to find the tables that must be joined.

When to use a tool:
- A table or entity implied by the question is not present in the context above.
- A needed join/bridge or master/lookup table is likely missing.
- A business key in the context (e.g. order_no, doc_entry, card_code, item_code,
  account_code) probably links to other tables not yet shown.

Tools:
- search_schema_by_table(table_name): find a table by (partial) name.
- search_schema_by_column(column_name): find tables that contain a column by that name.

Search discipline:
- Searches use substring matching, so use specific terms. Do NOT search for ubiquitous
  fragments like "id", "no", "code", or "name" alone — they match almost everything and
  waste effort. Search the distinctive part of a business key instead.
- Do not repeat a search for the same concept. Tool results omit tables already shown;
  a result of "Already in context" means that table is present — do not search it again.
- Keep it tight: a few targeted searches are enough. Stop once the required tables and
  their join path are covered.

Output rules:
- Never invent tables or columns. The final answer may contain only names that appear in
  the retrieved schema above or in a tool result. (You may hypothesize names to search
  for, but not to output.)
- Respond with ONLY a JSON array of the fully-qualified table names ("schema.table")
  required to answer the question. No prose, no markdown.
  Example: ["public.orders", "public.users"]
"""


def _strip_markdown_fences(text: str) -> str:
    """```json ... ``` veya ``` ... ``` sarmalını kaldırır (analyzer_service ile aynı desen)."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _new_blocks_to_text(rows: list[dict], seen_tables: set[str]) -> str:
    """
    Araç sonucu satırlarını schema_text bloğuna çevirir; ancak yalnızca daha önce
    görülmemiş tabloların bloklarını döndürür (RAG'de zaten gelen ya da önceki bir
    aramada dönmüş tabloları tekrar LLM context'ine eklemez). Görülenler `seen_tables`
    set'ine eklenir; zaten bilinenler yalnızca adıyla kısaca bildirilir.
    """
    new_blocks, already_known = [], []
    for r in rows:
        name = (r.get("table_name") or "").strip()
        text = r.get("schema_text")
        if not text:
            continue
        key = name.lower()
        if key in seen_tables:
            already_known.append(name)
            continue
        seen_tables.add(key)
        new_blocks.append(text)
    if new_blocks:
        return "\n".join(new_blocks)
    if already_known:
        return "Already in context (no new tables): " + ", ".join(already_known)
    return "No matching tables found."


def _tables_in_scheme(scheme: str) -> list[str]:
    """RAG şema metnindeki 'Table: <name> ...' satırlarından tablo adlarını çıkarır."""
    names = []
    for match in re.finditer(r"^Table:\s*([^\s(]+)", scheme, flags=re.MULTILINE):
        names.append(match.group(1).strip())
    return names


def _is_enabled() -> bool:
    return os.getenv("SCHEMA_COMPLETION_ENABLED", "true").strip().lower() not in ("false", "0", "no")


class SchemaCompletionService:
    """RAG şemasını doğrulayıp eksikse araçlarla zenginleştiren orta katman ajanı."""

    def complete(self, question: str, db_type: str, database_id: str, rag_scheme: str) -> str:
        """
        Soruyu ve RAG şemasını alır; gereken tabloları belirleyip schema_text bloklarını
        deterministik olarak yeniden kurar. Hata/boş durumda rag_scheme'i olduğu gibi döner.
        """
        if not _is_enabled():
            return rag_scheme

        try:
            return self._run(question, db_type, database_id, rag_scheme)
        except Exception:
            logger.exception("Schema-completion ajanı başarısız; RAG şeması olduğu gibi kullanılıyor")
            return rag_scheme

    def _run(self, question: str, db_type: str, database_id: str, rag_scheme: str) -> str:
        # RAG'de zaten gelen tabloların adlarıyla başlat; araç sonuçları bunları
        # (ve aramalar arası tekrarları) tam blok olarak yeniden döndürmesin.
        seen_tables = {name.lower() for name in _tables_in_scheme(rag_scheme)}

        # database_id'yi closure ile bağla; LLM'in bunu geçmesine gerek kalmaz.
        @tool
        def search_schema_by_table(table_name: str) -> str:
            """Find a database table by its (partial) name and return its schema block."""
            rows = weaviate_service.find_tables_by_name(database_id, table_name)
            return _new_blocks_to_text(rows, seen_tables)

        @tool
        def search_schema_by_column(column_name: str) -> str:
            """Find database tables that contain a column with this name and return their schema blocks."""
            rows = weaviate_service.find_tables_by_column(database_id, column_name)
            return _new_blocks_to_text(rows, seen_tables)

        tools = [search_schema_by_table, search_schema_by_column]
        tools_by_name = {t.name: t for t in tools}

        llm = get_llm().bind_tools(tools)

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT.format(db_type=db_type, rag_scheme=rag_scheme)),
            HumanMessage(content=question),
        ]

        final_text = ""
        for _ in range(_MAX_ITERATIONS):
            response = llm.invoke(messages)
            messages.append(response)

            tool_calls = getattr(response, "tool_calls", None)
            if not tool_calls:
                final_text = response.content if isinstance(response.content, str) else ""
                break

            for call in tool_calls:
                fn = tools_by_name.get(call["name"])
                result = fn.invoke(call["args"]) if fn else f"Unknown tool: {call['name']}"
                messages.append(ToolMessage(content=result, tool_call_id=call["id"]))

        required = self._parse_required_tables(final_text)

        # Ajanın seçtiği tabloları, RAG'in zaten getirdikleriyle birleştir (regresyon olmasın).
        table_names = list(dict.fromkeys(required + _tables_in_scheme(rag_scheme)))

        rows = weaviate_service.get_schema_text_for_tables(database_id, table_names)
        blocks = []
        seen = set()
        for r in rows:
            key = (r.get("schema_name"), r.get("table_name"))
            text = r.get("schema_text")
            if text and key not in seen:
                seen.add(key)
                blocks.append(text)

        if not blocks:
            return rag_scheme

        enriched = "\n".join(blocks)
        logger.info(
            "Schema-completion: RAG %d tablo, ajan %d tablo, birleşik %d blok",
            len(_tables_in_scheme(rag_scheme)),
            len(required),
            len(blocks),
        )
        return enriched

    @staticmethod
    def _parse_required_tables(text: str) -> list[str]:
        """Ajanın son mesajındaki JSON dizisini güvenle çözer; başarısızsa []."""
        if not text:
            return []
        try:
            parsed = json.loads(_strip_markdown_fences(text))
        except (json.JSONDecodeError, ValueError):
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item) for item in parsed if item]
