"""
Her tablo için LLM ile kısa bir "bu tablo ne işe yarar" açıklaması üretir.

Açıklama hiçbir yere kalıcı yazılmaz (postgres/table_metadata değişmez); yalnızca
indeksleme sırasında Weaviate `content`'ine eklenip embedding kalitesini artırmak
için kullanılır. Üretim her tablo için ayrı bir LLM çağrısıdır.
"""

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from services.llm_provider import get_llm

logger = logging.getLogger(__name__)

# Özet uzunluk sınırları — hem prompt'ta açıkça belirtilir hem kodda güvenlik
# amaçlı kırpılır.
MAX_LINES = 2
MAX_CHARS = 240

_SYSTEM_PROMPT = (
    "You write a very short description of a single database table's PURPOSE.\n"
    "You are given the table's schema (name, columns with types, primary/foreign keys).\n"
    "Explain in plain English WHAT THE TABLE IS FOR and what kind of data it holds, "
    "so it can be matched against natural-language user questions.\n\n"
    "STRICT OUTPUT RULES:\n"
    f"- Maximum {MAX_LINES} lines.\n"
    f"- Maximum {MAX_CHARS} characters in total.\n"
    "- Be a concise SUMMARY of the table's purpose; do NOT list columns one by one.\n"
    "- Write in English.\n"
    "- No markdown, no quotes, no preamble, no labels. Output ONLY the description text.\n"
)


def _normalize_content(content) -> str:
    """LLM çıktısını düz metne indir (analyzer_service ile aynı desen)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [p for p in content if isinstance(p, str)]
        if parts:
            return " ".join(parts)
    return ""


def _enforce_limits(text: str) -> str:
    """En fazla MAX_LINES satır ve MAX_CHARS karakter olacak şekilde kırp."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    text = "\n".join(lines[:MAX_LINES]).strip()
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS].rstrip()
    return text


def generate_description(db_type: str, schema_text: str) -> str:
    """
    Verilen tablo şema bloğundan kısa bir açıklama üretir. Herhangi bir hata
    durumunda boş string döner (indeksleme açıklamasız devam edebilsin diye).
    """
    if not schema_text or not schema_text.strip():
        return ""

    try:
        llm = get_llm()
    except Exception:
        logger.exception("LLM açıklama üretimi için kullanılamıyor")
        return ""

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=f"Database type: {db_type}\n\n{schema_text}"),
    ]

    try:
        response = llm.invoke(messages)
        text = _normalize_content(response.content).strip()
        return _enforce_limits(text)
    except Exception:
        logger.exception("Tablo açıklaması üretilemedi")
        return ""
