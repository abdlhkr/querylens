from fastapi import APIRouter
from fastapi.responses import JSONResponse

from core.exceptions import InvalidInputError, LLMProviderError, QueryGenerationError
from schemas.query import QueryRequest, QueryResponse
from schemas.fix_query import FixQueryRequest, FixQueryResponse
from schemas.response import ApiResponse
from services.query_service import QueryService
from services.fix_query_service import FixQueryService

router = APIRouter(prefix="/query", tags=["Query"])

_service = QueryService()
_fix_service = FixQueryService()


@router.post(
    "/",
    response_model=ApiResponse[QueryResponse],
    summary="SQL sorgusu üret",
    description="Verilen veritabanı tipi, şema ve soru bilgisiyle bir SELECT sorgusu üretir.",
)
async def generate_query(request: QueryRequest) -> ApiResponse[QueryResponse]:
    try:
        sql = _service.generate_query(request)
        return ApiResponse.ok(data=QueryResponse(sql_query=sql))
    except (LLMProviderError, QueryGenerationError, InvalidInputError):
        raise  # global handler devralır


@router.post(
    "/fix",
    response_model=ApiResponse[FixQueryResponse],
    summary="Hatalı SQL sorgusunu düzelt",
    description="Hatalı SQL sorgusunu, hata mesajını ve veritabanı şemasını kullanarak düzeltilmiş bir SELECT sorgusu üretir.",
)
async def fix_query(request: FixQueryRequest) -> ApiResponse[FixQueryResponse]:
    try:
        sql = _fix_service.fix_query(request)
        return ApiResponse.ok(data=FixQueryResponse(sql_query=sql))
    except (LLMProviderError, QueryGenerationError, InvalidInputError):
        raise  # global handler devralır