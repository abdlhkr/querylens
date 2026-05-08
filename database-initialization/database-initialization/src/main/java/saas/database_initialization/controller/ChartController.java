package saas.database_initialization.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import saas.database_initialization.client.FastServiceClient;
import saas.database_initialization.dto.query.ChartRecommendRequest;
import saas.database_initialization.dto.query.ChartRecommendResponse;
import saas.database_initialization.dto.response.ApiResponse;

@Slf4j
@RestController
@RequestMapping("/api/devices/charts")
@RequiredArgsConstructor
public class ChartController {

    private final FastServiceClient fastServiceClient;

    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<ChartRecommendResponse>> recommend(
            @Valid @RequestBody ChartRecommendRequest request,
            @RequestHeader("X-User-Id") String userId) {

        log.info("POST /api/devices/charts/recommend - User: {}, columns: {}",
                userId, request.getColumns());

        ChartRecommendResponse result = fastServiceClient.recommendChart(
                request.getQuestion(),
                request.getColumns(),
                request.getSampleRows());

        return ResponseEntity.ok(ApiResponse.success(result, "Chart recommendation successful"));
    }
}
