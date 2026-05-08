package Kara.Auth.dto;

import lombok.Data;

@Data
public class ChangeEmailRequest {
    private String code;
    private String newEmail;
}
