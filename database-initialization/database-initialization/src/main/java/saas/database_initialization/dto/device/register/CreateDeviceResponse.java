package saas.database_initialization.dto.device.register;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateDeviceResponse {
    private String deviceRegistryId;
}
