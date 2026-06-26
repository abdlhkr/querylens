import logging
import logging.config
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from core.exceptions import InvalidInputError, LLMProviderError, QueryGenerationError
from routers import chart_router, index_router, query_router
from schemas.response import ApiResponse
from services import weaviate_service

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"],
    },
})

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Weaviate koleksiyonunu hazırla. Weaviate erişilemese bile servis
    # ayağa kalksın (sorgu anında tekrar denenir / hata döner).
    try:
        weaviate_service.ensure_collection()
    except Exception:
        logger.exception("Weaviate koleksiyonu hazırlanamadı (startup)")
    yield
    # Shutdown: bağlantıyı temiz kapat.
    try:
        weaviate_service.close_client()
    except Exception:
        logger.exception("Weaviate bağlantısı kapatılırken hata")


app = FastAPI(
    title="Fast-Service",
    description="Doğal dil sorusunu SQL SELECT sorgusuna dönüştüren AI servisi.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Router Kayıtları ──────────────────────────────────────────────────────────
app.include_router(query_router.router)
app.include_router(chart_router.router)
app.include_router(index_router.router)


# ── Global Exception Handler'lar ──────────────────────────────────────────────
@app.exception_handler(InvalidInputError)
async def invalid_input_handler(request: Request, exc: InvalidInputError) -> JSONResponse:
    logger.warning("InvalidInputError [%s %s]: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=400,
        content=ApiResponse.fail(str(exc)).model_dump(),
    )


@app.exception_handler(LLMProviderError)
async def llm_provider_handler(request: Request, exc: LLMProviderError) -> JSONResponse:
    logger.error("LLMProviderError [%s %s]: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content=ApiResponse.fail(str(exc)).model_dump(),
    )


@app.exception_handler(QueryGenerationError)
async def query_generation_handler(request: Request, exc: QueryGenerationError) -> JSONResponse:
    logger.error("QueryGenerationError [%s %s]: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content=ApiResponse.fail(str(exc)).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Beklenmeyen hata [%s %s]", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=ApiResponse.fail(f"Beklenmeyen hata: {exc}").model_dump(),
    )