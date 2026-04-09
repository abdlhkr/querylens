package saas.database_initialization.dto.query;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for natural language to SQL query generation + execution.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NaturalLanguageQueryRequest {

    @NotBlank(message = "Question is required")
    private String question;
}
