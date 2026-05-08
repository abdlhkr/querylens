package saas.database_initialization.dto.query;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChartRecommendRequest {

    @NotBlank(message = "question is required")
    private String question;

    @NotEmpty(message = "columns must not be empty")
    private List<String> columns;

    private List<Map<String, Object>> sampleRows;
}
