package Kara.Auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountStatusResponse {
    private boolean passwordSet;
    private String email;
}
