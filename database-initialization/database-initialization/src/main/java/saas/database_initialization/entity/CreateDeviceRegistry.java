package saas.database_initialization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
public class CreateDeviceRegistry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID deviceID;
    private String userID;
    private Date expirationTime;


    public void setExpirationTime() {
        this.expirationTime = new Date(System.currentTimeMillis() + 30L * 60 * 1000);
    }
}
