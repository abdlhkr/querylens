package saas.database_initialization.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import saas.database_initialization.dto.query.ChartRecommendResponse;
import saas.database_initialization.dto.query.FastServiceAnalysisResult;
import saas.database_initialization.exception.BadRequestException;

import java.util.List;
import java.util.Map;

/**
 * HTTP client for calling the fast_service NL-to-SQL API.
 *
 * Endpoint used: POST /query/
 * Body: { "db_type": "...", "db_scheme": "...", "question": "..." }
 * Response: { "success": true, "data": { "type": "sql"|"unavailable"|"general", ... } }
 */
@Slf4j
@Component
public class FastServiceClient {

    private final WebClient webClient;

    public FastServiceClient(@Value("${fast.service.url}") String fastServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(fastServiceUrl)
                .build();
    }

    /**
     * Calls fast_service /query/ which now runs the analyzer before SQL generation.
     * Returns a result with type="sql", "unavailable", or "general".
     *
     * @param dbType   e.g. "POSTGRESQL"
     * @param dbScheme plain-text schema from introspection results
     * @param question natural language question from the user
     * @return {@link FastServiceAnalysisResult} with type and relevant fields populated
     */
    public FastServiceAnalysisResult analyzeQuery(String dbType, String dbScheme, String question) {
        log.info("Calling fast_service to analyze question: {}", question);

        Map<String, String> requestBody = Map.of(
                "db_type", dbType,
                "db_scheme", dbScheme,
                "question", question);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/query/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new BadRequestException("fast_service returned an empty response");
            }

            Boolean success = (Boolean) response.get("success");
            if (Boolean.FALSE.equals(success)) {
                String error = (String) response.get("error");
                throw new BadRequestException("fast_service error: " + error);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            if (data == null || !data.containsKey("type")) {
                throw new BadRequestException("fast_service response missing type field");
            }

            String type = (String) data.get("type");
            FastServiceAnalysisResult result = FastServiceAnalysisResult.builder()
                    .type(type)
                    .sql((String) data.get("sql"))
                    .message((String) data.get("message"))
                    .suggestedQuestion((String) data.get("suggestedQuestion"))
                    .build();

            log.info("fast_service analysis type: {}", type);
            return result;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call fast_service", e);
            throw new BadRequestException("Failed to reach fast_service: " + e.getMessage());
        }
    }

    /**
     * Calls fast_service to fix a failed SQL query using the LLM.
     *
     * @param dbType       e.g. "POSTGRESQL"
     * @param dbScheme     plain-text schema from introspection results
     * @param failedQuery  the SQL query that failed
     * @param errorMessage the error message from the failed execution
     * @param question     original natural language question from the user
     * @return corrected SQL query string
     */
    public String fixSql(String dbType, String dbScheme,
                         String failedQuery, String errorMessage, String question) {
        log.info("Calling fast_service to fix SQL. Failed query: {}, Error: {}",
                failedQuery, errorMessage);

        Map<String, String> requestBody = Map.of(
                "db_type", dbType,
                "db_scheme", dbScheme,
                "failed_query", failedQuery,
                "error_message", errorMessage,
                "question", question);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/query/fix")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new BadRequestException("fast_service returned an empty response for fix request");
            }

            Boolean success = (Boolean) response.get("success");
            if (Boolean.FALSE.equals(success)) {
                String error = (String) response.get("error");
                throw new BadRequestException("fast_service fix error: " + error);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            if (data == null || !data.containsKey("sql_query")) {
                throw new BadRequestException("fast_service fix response missing sql_query field");
            }

            String sql = (String) data.get("sql_query");
            log.info("fast_service fixed SQL: {}", sql);
            return sql;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call fast_service for fix", e);
            throw new BadRequestException("Failed to reach fast_service for fix: " + e.getMessage());
        }
    }

    public ChartRecommendResponse recommendChart(String question,
                                                  List<String> columns,
                                                  List<Map<String, Object>> sampleRows) {
        log.info("Calling fast_service /chart/recommend for question: {}", question);

        List<Map<String, Object>> trimmed = sampleRows != null
                ? sampleRows.subList(0, Math.min(5, sampleRows.size()))
                : List.of();

        Map<String, Object> requestBody = Map.of(
                "question", question,
                "columns", columns,
                "sample_rows", trimmed);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/chart/recommend")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new BadRequestException("fast_service returned empty response for chart recommend");
            }

            Boolean success = (Boolean) response.get("success");
            if (Boolean.FALSE.equals(success)) {
                throw new BadRequestException("fast_service chart error: " + response.get("error"));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) response.get("data");

            @SuppressWarnings("unchecked")
            List<String> valueFields = (List<String>) data.get("valueFields");

            return ChartRecommendResponse.builder()
                    .chartType((String) data.get("chartType"))
                    .keyField((String) data.get("keyField"))
                    .valueFields(valueFields)
                    .reason((String) data.get("reason"))
                    .build();

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call fast_service /chart/recommend", e);
            throw new BadRequestException("Failed to reach fast_service for chart: " + e.getMessage());
        }
    }
}