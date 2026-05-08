package Kara.Auth.dto;

import lombok.Data;

@Data
public class SetPasswordRequest {
    private String code;
    private String newPassword;
    private String confirmPassword;
}
