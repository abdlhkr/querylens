from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from core.exceptions import InvalidInputError, LLMProviderError, QueryGenerationError
from routers import query_router
from schemas.response import ApiResponse

app = FastAPI(
    title="Fast-Service",
    description="Doğal dil sorusunu SQL SELECT sorgusuna dönüştüren AI servisi.",
    version="1.0.0",
)

# ── Router Kayıtları ──────────────────────────────────────────────────────────
app.include_router(query_router.router)


# ── Global Exception Handler'lar ──────────────────────────────────────────────
@app.exception_handler(InvalidInputError)
async def invalid_input_handler(_: Request, exc: InvalidInputError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=ApiResponse.fail(str(exc)).model_dump(),
    )


@app.exception_handler(LLMProviderError)
async def llm_provider_handler(_: Request, exc: LLMProviderError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content=ApiResponse.fail(str(exc)).model_dump(),
    )


@app.exception_handler(QueryGenerationError)
async def query_generation_handler(
    _: Request, exc: QueryGenerationError
) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=ApiResponse.fail(str(exc)).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=ApiResponse.fail(f"Beklenmeyen hata: {exc}").model_dump(),
    )