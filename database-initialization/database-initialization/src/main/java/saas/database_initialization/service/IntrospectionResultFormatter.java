package saas.database_initialization.service;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Converts JSON query result data (List of Map rows) into
 * a human-readable plain text table format.
 *
 * Example output:
 * table_name | table_type
 * --------------|------------
 * users | BASE TABLE
 * orders | BASE TABLE
 */
@Component
public class IntrospectionResultFormatter {

    /**
     * Convert query result rows into a plain text table
     */
    public String format(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return "(no results)";
        }

        // Get column names from the first row
        List<String> columns = rows.get(0).keySet().stream()
                .collect(Collectors.toList());

        if (columns.isEmpty()) {
            return "(no columns)";
        }

        // Calculate max width for each column
        Map<String, Integer> columnWidths = columns.stream()
                .collect(Collectors.toMap(
                        col -> col,
                        col -> Math.max(
                                col.length(),
                                rows.stream()
                                        .mapToInt(row -> String.valueOf(row.getOrDefault(col, "")).length())
                                        .max()
                                        .orElse(0))));

        StringBuilder sb = new StringBuilder();

        // Header row
        sb.append(columns.stream()
                .map(col -> padRight(col, columnWidths.get(col)))
                .collect(Collectors.joining(" | ")));
        sb.append("\n");

        // Separator row
        sb.append(columns.stream()
                .map(col -> "-".repeat(columnWidths.get(col)))
                .collect(Collectors.joining("-|-")));
        sb.append("\n");

        // Data rows
        for (Map<String, Object> row : rows) {
            sb.append(columns.stream()
                    .map(col -> padRight(String.valueOf(row.getOrDefault(col, "")), columnWidths.get(col)))
                    .collect(Collectors.joining(" | ")));
            sb.append("\n");
        }

        return sb.toString().stripTrailing();
    }

    private String padRight(String text, int width) {
        if (text.length() >= width) {
            return text;
        }
        return text + " ".repeat(width - text.length());
    }
}
