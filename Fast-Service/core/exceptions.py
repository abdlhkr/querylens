class LLMProviderError(Exception):
    """LLM sağlayıcısı başlatılamadığında veya erişilemediğinde fırlatılır."""
    pass


class QueryGenerationError(Exception):
    """SQL sorgusu üretimi sırasında hata oluştuğunda fırlatılır."""
    pass


class InvalidInputError(Exception):
    """Geçersiz veya eksik giriş parametreleri söz konusu olduğunda fırlatılır."""
    pass
