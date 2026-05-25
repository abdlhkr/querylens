from langchain_openai import ChatOpenAI
from core.exceptions import LLMProviderError
from dotenv import load_dotenv
import os


load_dotenv()
_llm: ChatOpenAI | None = None


def get_llm() -> ChatOpenAI:
    """
    LLM singletonını döner.
    Başlatma başarısız olursa LLMProviderError fırlatır.
    """
    global _llm
    if _llm is None:
        try:
            _llm = ChatOpenAI(
                model="gpt-5.4",
                temperature=0
                )
        except Exception as exc:
            raise LLMProviderError(
                f"LLM sağlayıcısı başlatılamadı: {exc}"
            ) from exc
    return _llm