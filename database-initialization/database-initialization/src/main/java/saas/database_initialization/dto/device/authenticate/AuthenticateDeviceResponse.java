package saas.database_initialization.dto.device.authenticate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticateDeviceResponse {
    private UUID registeredDeviceID;
}
