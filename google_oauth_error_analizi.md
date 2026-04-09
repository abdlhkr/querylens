# Google OAuth2 Login & Kayıt Ol (500 Internal Server Error) Analizi

Kullanıcıların Google ile "Giriş Yap" veya "Kayıt Ol" seçeneklerini kullandığında aldıkları **Whitelabel Error Page (500 Internal Server Error)** hatasının nedenleri araştırılmış ve tespit edilmiştir.

## 1. Neden Giriş Yap ve Kayıt Ol Butonları Aynı Sayfayı Açıyor?
Uygulama `front-app` üzerinden Google girişi/kaydı tetiklendiğinde `SecurityConfig.java` üzerinde tanımlı olan **`/oauth2/authorization/google`** endpoint'ini kullanır. Google OAuth2 protokolü, "Giriş" (Login) ve "Kayıt" (Sign up) işlemlerini ayrı ayrı ele almaz. Kullanıcının kimliğini doğrulayıp Backend'e gönderir. Sizin Backend servisiniz (Auth Service) `OAuth2SuccessHandler` içinde kullanıcının zaten veritabanında kayıtlı olup olmadığını (Senaryo A, B, C) tespit edip ona göre günceller veya yaratır. Her iki butonun da aynı Google hesabınıza erişim onay penceresini açması beklenen ve **doğru olan davranıştır.**

## 2. 500 Internal Server Error Hatasının Asıl Nedeni: "Refresh Token Çakışması"

Google hesabınız doğrulandıktan sonra, uygulama sizi başarıyla geri yönlendirir ve `OAuth2SuccessHandler` sınıfı içindeki kodlar devreye girer. Sizin belirttiğiniz *"mail db'de ekli bundan eminim"* durumunda, **Senaryo A** veya **Senaryo B** çalışır ve kullanıcı başarıyla bulunur. Ancak sorun, bulunduktan sonra yaşanır.

### Sorunun Kaynağı: `RefreshToken` Entity'si ve Veritabanı Kısıtlaması
Gelen hata, yeni bir access/refresh token çifti oluşturulmaya çalışılırken fırlatılmaktadır:

- **Auth Service - `RefreshToken.java`:** Refresh Token entity'si, `UserCredentials` entity'sine **`@OneToOne`** (Bire bir) ilişkiyle bağlanmıştır. Bu demek oluyor ki, veritabanındaki `refresh_token` tablosunda **bir kullanıcının aynı anda sadece ve sadece BİR adet** aktif token'ı olabilir. Veritabanında `user_id` kolonu üzerinde `UNIQUE` (benzersizlik) kısıtlaması (constraint) vardır.
- Normal giriş (`AuthService.login`) metodunda, kullanıcı giriş yaptığı zaman token üretilmeden önce sistem eski token'ı **siler**:
  ```java
  refreshTokenRepository.deleteByUser(userCredentials);
  refreshTokenRepository.flush();
  return generateTokens(userCredentials);
  ```
- **Fakat Google OAuth2 handler'ı (`OAuth2SuccessHandler.java`) eksik koda sahiptir.** Başarılı Google doğrulamasından sonra doğrudan yeni bir refresh token üretmeye çalışmaktadır:
  ```java
  // Burada eski token SİLİNMEDEN yenisi kaydedilmeye çalışılıyor! (SATIR 80)
  String refreshToken = refreshTokenService.generateRefreshToken(user).getToken();
  ```

Kullanıcı veritabanında zaten kayıtlıysa, çok yüksek ihtimalle eski bir oturumundan kalan refresh_token kaydı tablodadır.
Sistem, eski kaydı silmeden yeni tokenı kaydetmek (`refreshTokenRepository.save()`) istediğinde, **Aynı user_id'ye ait 2. kayıt eklendiği için Veritabanı UNIQUE kısıtlamasını ihlal eder (`DataIntegrityViolationException`)**. Spring Boot bu kısıtlama hatasını yakalamadığı için uygulama aniden çöker ve kullanıcının ön yüzüne meşhur *Whitelabel Error Page 500 Internal Server Error* cevabını döner.

---

## 3. Nasıl Çözülür?

Çözüm son derece basittir. İki farklı yaklaşım uygulanabilir:

### Çözüm Yolu A: `RefreshTokenService`'i Merkezi Olarak Güvenli Hale Getirmek (Önerilen)
`RefreshTokenService.java` dosyasındaki `generateRefreshToken` metoduna `@Transactional` anotasyonu eklenerek, token üretmeden hemen önce eski token'ı silmesi sağlanabilir.

```java
@Transactional
public RefreshToken generateRefreshToken(UserCredentials user){
    // Önce bu kullanıcıya ait var olan eski refresh token'ları sil
    refreshTokenRepository.deleteByUser(user);
    // Yeni token oluştur ve dön
    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setToken(UUID.randomUUID().toString());
    refreshToken.setExpiryDate(new Date(System.currentTimeMillis() + expiration));
    refreshToken.setUser(user);
    refreshTokenRepository.save(refreshToken);
    return refreshToken;
}
```
*Bu değişikliği yaparsanız `AuthService` içindeki login vs. metotlarında tekrar tekrar `deleteByUser` çağırmanıza gerek kalmaz. Mimari daha temiz olur.*

### Çözüm Yolu B: Gerekli Silme İşlemini `OAuth2SuccessHandler.java` İçinde Yapmak
`OAuth2SuccessHandler.java` sınıfının içine `RefreshTokenRepository` enjekte edilerek (veya service metodu kullanılarak) token oluşturulmadan hemen önce silme işlemi tetiklenebilir:

```java
// OAuth2SuccessHandler.java -> Satır 80'den hemen önce
refreshTokenRepository.deleteByUser(user);
String refreshToken = refreshTokenService.generateRefreshToken(user).getToken();
```
*(Not: `deleteByUser` spring data jpa modifikasyon sorgusudur, çalışıp `TransactionRequiredException` atmaması için işlemi transaction içinde çağırmaya dikkat etmeniz gerekebilir)*

### Ayrıca Dikkat Edilmesi Gereken Bir Nokta: Kullanıcı Rolü Parçalanması
Kullanıcınızın eğer (şok nadir bir durum olsa da) `role` alanı veritabanında `NULL` ise, OAuth2SuccessHandler içindeki `user.getRole().toString()` kodu **NullPointerException** atıp yine 500 verdirebilir. Eski DB kayıtlarınızda boş rolde kullanıcı yoksa bu durum oluşmaz, ancak bilginiz olsun.
