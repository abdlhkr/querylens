package saas.database_initialization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.enums.DeviceStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "devices")
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID registeredDeviceID;

    @Column(nullable = false)
    private UUID userID;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status = DeviceStatus.PENDING;

    @Column
    private LocalDateTime connectedAt;

    @Column
    private LocalDateTime lastSeenAt;

    @Column
    private String connectionId; // WebSocket session ID

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = DeviceStatus.PENDING;
        }
    }
}
