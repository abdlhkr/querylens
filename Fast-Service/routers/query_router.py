from fastapi import APIRouter

from core.exceptions import InvalidInputError, LLMProviderError, QueryGenerationError
from schemas.analyzer import (
    GeneralQueryResponse,
    SqlQueryResponse,
    UnavailableQueryResponse,
)
from schemas.fix_query import FixQueryRequest, FixQueryResponse
from schemas.query import QueryRequest, QueryResponse
from schemas.response import ApiResponse
from services.analyzer_service import AnalyzerService
from services.fix_query_service import FixQueryService
from services.query_service import QueryService

router = APIRouter(prefix="/query", tags=["Query"])

_service = QueryService()
_fix_service = FixQueryService()
_analyzer = AnalyzerService()


@router.post(
    "/",
    summary="SQL sorgusu üret",
    description="Soruyu önce analiz eder; şemada yanıtlanabilirse SELECT sorgusu üretir.",
)
async def generate_query(request: QueryRequest):
    try:
        analysis = _analyzer.analyze(request.question, request.db_type, request.db_scheme)

        if analysis.case == 1:
            rephrased = QueryRequest(
                db_type=request.db_type,
                db_scheme=request.db_scheme,
                question=analysis.rephrasedQuestion or request.question,
            )
            sql = _service.generate_query(rephrased)
            return ApiResponse.ok(data=SqlQueryResponse(sql=sql, analysis=analysis))

        elif analysis.case == 2:
            return ApiResponse.ok(
                data=UnavailableQueryResponse(
                    message=analysis.userMessage,
                    suggestedQuestion=analysis.suggestedQuestion,
                    analysis=analysis,
                )
            )

        else:  # case 3
            return ApiResponse.ok(
                data=GeneralQueryResponse(
                    message=analysis.userMessage,
                    analysis=analysis,
                )
            )

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
