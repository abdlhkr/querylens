package kara.saas.dto;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import kara.saas.entity.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String firstName;
    private String lastName;
    private int age;
    private String gender;
}
