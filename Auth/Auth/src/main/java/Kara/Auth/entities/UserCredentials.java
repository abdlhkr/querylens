package Kara.Auth.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserCredentials {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    // OAuth2 kullanıcılarının şifresi olmayabilir → nullable
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = true)
    private String password;

    // Google OAuth2'den gelen kalıcı unique kullanıcı ID'si (sub claim)
    // Aynı kişi farklı email'lerle gelse bile bu ID sabittir
    @Column(nullable = true, unique = true)
    private String googleId;

    // Normal register ile mi yoksa OAuth2 ile mi kayıt olundu?
    // false ise kullanıcı şifre set etmemiştir (OAuth-only hesap)
    @Column(nullable = false)
    private boolean passwordSet = true;

    @Enumerated(EnumType.STRING)
    private Role role;

    boolean isEnabled = true;
}
