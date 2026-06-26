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
from services import weaviate_service
from services.analyzer_service import AnalyzerService
from services.fix_query_service import FixQueryService
from services.query_service import QueryService
from services.schema_completion_service import SchemaCompletionService

router = APIRouter(prefix="/query", tags=["Query"])

_service = QueryService()
_fix_service = FixQueryService()
_analyzer = AnalyzerService()
_completion = SchemaCompletionService()


@router.post(
    "/",
    summary="SQL sorgusu üret",
    description="Soruyu önce analiz eder; şemada yanıtlanabilirse SELECT sorgusu üretir.",
)
async def generate_query(request: QueryRequest):
    try:
        # Soruya en alakalı tabloları Weaviate'ten seç → db_scheme.
        db_scheme = weaviate_service.search_tables(request.database_id, request.question)
        if not db_scheme:
            raise InvalidInputError(
                "Bu veritabanı için indekslenmiş şema bulunamadı. "
                "Lütfen introspection tamamlanana kadar bekleyin veya veritabanını yeniden doğrulayın."
            )

        # Orta katman: RAG şemasının yeterliliğini doğrula, eksikse araçlarla zenginleştir.
        db_scheme = _completion.complete(
            request.question, request.db_type, request.database_id, db_scheme
        )

        analysis = _analyzer.analyze(request.question, request.db_type, db_scheme)

        if analysis.case == 1:
            rephrased = QueryRequest(
                db_type=request.db_type,
                database_id=request.database_id,
                question=analysis.rephrasedQuestion or request.question,
            )
            sql = _service.generate_query(rephrased, db_scheme)
            return ApiResponse.ok(
                data=SqlQueryResponse(sql=sql, analysis=analysis, dbScheme=db_scheme)
            )

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
