package Kara.Auth.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
    private int code;
    private String newPassword;
}
