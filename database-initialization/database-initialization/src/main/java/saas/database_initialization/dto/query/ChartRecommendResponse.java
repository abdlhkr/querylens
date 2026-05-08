package saas.database_initialization.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChartRecommendResponse {
    private String chartType;
    private String keyField;
    private List<String> valueFields;
    private String reason;
}
