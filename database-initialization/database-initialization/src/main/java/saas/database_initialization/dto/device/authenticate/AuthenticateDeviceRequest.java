package saas.database_initialization.dto.device.authenticate;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticateDeviceRequest {
    @Nullable
    private String userID;
    @NotBlank(message = "Device registry ID is required")
    private String deviceRegistryID;
}
