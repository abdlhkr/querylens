package saas.database_initialization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.enums.DatabaseType;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class DatabaseIntrospectionQueries {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DatabaseType dbType;

    @Column(name = "query_text", columnDefinition = "TEXT", nullable = false)
    private String query;
}
