package Kara.Auth.dto;

import lombok.Data;

@Data
public class LoginVerifyRequest {
    private String email;
    private int code;
}
