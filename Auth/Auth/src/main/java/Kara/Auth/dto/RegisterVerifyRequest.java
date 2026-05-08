package Kara.Auth.dto;

import lombok.Data;

@Data
public class RegisterVerifyRequest {
    private String email;
    private int code;
}
