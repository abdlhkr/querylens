from fastapi import APIRouter

from core.exceptions import InvalidInputError, LLMProviderError, QueryGenerationError
from schemas.chart import ChartRecommendRequest, ChartRecommendResponse
from schemas.response import ApiResponse
from services.chart_hint_service import ChartHintService

router = APIRouter(prefix="/chart", tags=["Chart"])

_service = ChartHintService()


@router.post(
    "/recommend",
    response_model=ApiResponse[ChartRecommendResponse],
    summary="Grafik tipi öner",
    description="Sorgu sonucu sütunları ve örnek satırlar verildiğinde en uygun grafik tipini ve eksen alanlarını döner.",
)
async def recommend_chart(request: ChartRecommendRequest) -> ApiResponse[ChartRecommendResponse]:
    try:
        result = _service.recommend(request)
        return ApiResponse.ok(data=result)
    except (LLMProviderError, QueryGenerationError, InvalidInputError):
        raise
