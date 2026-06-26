package saas.database_initialization.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parsed result from fast-service POST /query/ after the analyzer layer was added.
 * type="sql"         → sql field is populated; proceed to execution pipeline.
 * type="unavailable" → message + suggestedQuestion populated; skip SQL execution.
 * type="general"     → message populated; skip SQL execution.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FastServiceAnalysisResult {
    private String type;
    private String sql;
    private String message;
    private String suggestedQuestion;
    /**
     * Schema text fast-service selected from Weaviate for this question.
     * Reused for the self-heal /fix call so it operates on the same schema.
     */
    private String dbScheme;
}
