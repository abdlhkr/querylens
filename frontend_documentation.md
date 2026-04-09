# Frontend Developer Documentation
> **Proje:** AI-Powered NL-to-SQL SaaS Platformu  
> **Hazırlanma Tarihi:** 2026-03-16  
> **Durum:** Backend aktif, frontend geliştirme aşaması

---

## 1. Mimariye Genel Bakış

Tüm frontend istekleri **tek bir gateway**'e gider. Gateway JWT'yi doğrular, `X-User-Id` ve `X-User-Role` header'larını ekler ve isteği ilgili servise yönlendirir.

```
FRONTEND
   │
   ▼
Gateway  :8080  (tek giriş noktası)
   ├── /auth/**        → Auth Service    :8081
   ├── /api/users/**   → User Service    :8082
   ├── /api/devices/** → DB Service      :8083
   └── ws://…/ws/device → DB Service    :8083 (WebSocket)
```

> [!IMPORTANT]
> Frontend **her zaman** `http://localhost:8080` (ya da prod URL) ile konuşur. Port 8081/8082/8083 etc.'ye doğrudan istek atmaz.

---

## 2. Kimlik Doğrulama & Oturum Yönetimi

Sistem **HttpOnly Cookie** tabanlı JWT kullanır. Frontend `localStorage`'a token **kaydetmez**.

| Cookie | Kapsam | Süre |
|---|---|---|
| `access_token` | Tüm istekler (`path=/`) | Kısa (config'e göre) |
| `refresh_token` | Sadece `/auth/refresh` | Uzun (config'e göre) |

### Önemli Noktalar
- Cookie `HttpOnly` olduğu için JS ile okunamaz. `document.cookie` çalışmaz.
- Her API isteğine `credentials: 'include'` (fetch) veya `withCredentials: true` (axios) eklenmeli.
- `access_token` süresi dolduğunda `401` gelir → `/auth/refresh` çağrılır → başarılıysa orijinal istek tekrar edilir.
- Google OAuth2 desteği de mevcut. Cevap aynı cookie yapısıyla döner.

---

## 3. API Referansı

### 3.1 Auth Service — `/auth`

#### `POST /auth/register`
Yeni kullanıcı kaydı. Cookie'leri set eder.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd"
}
```

**Response (200):**
```json
{ "message": "Registration successful" }
```
Set-Cookie header'ları otomatik gelir.

---

#### `POST /auth/login`
Mevcut kullanıcı girişi. Cookie'leri set eder.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd"
}
```

**Response (200):**
```json
{ "message": "Login successful" }
```

---

#### `POST /auth/refresh`
Access token yenileme. `refresh_token` cookie otomatik gönderilir.

**Request:** Body yok. Cookie otomatik gönderilir.

**Response (200):**
```json
{ "message": "Token refreshed" }
```

**Response (401) — refresh token eksik:**
```json
{ "message": "Refresh token missing" }
```
→ Kullanıcıyı login sayfasına yönlendir.

---

#### `POST /auth/logout`
Her iki cookie'yi temizler.

**Request:** Body yok.

**Response (200):**
```json
{ "message": "Logged out" }
```

---

#### `GET /oauth2/authorization/google` *(OAuth2)*
Google login yönlendirmesi. Bu URL'e link ver, kullanıcı Google'a gider, döndüğünde cookie'ler set edilmiş olur. Frontend'e callback `/auth/oauth2/success` gibi bir URL üzerinden dönülür (gateway konfigürasyonuna bak).

---

### 3.2 User Service — `/api/users`

> [!NOTE]
> Bu endpoint'ler authenticate olmuş kullanıcı gerektirir. Gateway `X-User-Id`'yi otomatik ekler.

#### `POST /api/users`
**Kayıt sonrası zorunlu adım.** Profil oluşturur (onboarding).

**Request Body:**
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "age": 28,
  "gender": "MALE"
}
```

| Alan | Tip | Kural |
|---|---|---|
| `firstName` | string | Zorunlu, boş olamaz |
| `lastName` | string | Zorunlu, boş olamaz |
| `age` | int | Zorunlu, 0–150 |
| `gender` | string | `MALE` / `FEMALE` / `OTHER` |

**Response (201):**
```json
{
  "message": "User created successfully",
  "data": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "age": 28,
    "gender": "MALE"
  }
}
```

---

#### `GET /api/users/me`
Oturumdaki kullanıcının profilini getirir.

**Response (200):**
```json
{
  "data": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "age": 28,
    "gender": "MALE"
  }
}
```

---

#### `PUT /api/users`
Profil güncelleme.

**Request Body:** `CreateUserRequest` ile aynı alanlar (firstName, lastName, age, gender).

**Response (200):** Güncellenmiş `UserResponse`.

---

#### `DELETE /api/users`
Hesap silme.

**Response (200):**
```json
{ "message": "User deleted successfully" }
```

---

### 3.3 DB Service — Cihaz Yönetimi `/api/devices`

#### `POST /api/devices/register`
Kullanıcı için agent (cihaz) kayıt kodu üretir. Kod 30 dakika geçerlidir.

**Request Body:** `{}` (boş, userId gateway'den alınır)

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Device registered successfully",
  "data": {
    "registryId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```
`registryId` → Agent'a girilecek kod (UUID formatında).

---

#### `GET /api/devices/check`
Kullanıcının aktif kayıt kodu olup olmadığını kontrol eder.

**Response (200):**
```json
{
  "success": true,
  "data": true,
  "message": "User has active registration code"
}
```

---

#### `POST /api/devices/authenticate`
Kayıt kodunu doğrulayıp cihazı oluşturur. (Agent tarafından kullanılır, frontend normalde çağırmaz)

---

### 3.4 DB Service — Veritabanı Bağlantıları `/api/devices/databases`

#### `POST /api/devices/databases`
Yeni veritabanı bağlantısı ekler.

> [!IMPORTANT]
> **Şifre gönderilmez!** Şifre yalnızca agent'ta tutulur. Form'da şifre alanı olmayacak.

**Request Body:**
```json
{
  "host": "localhost",
  "port": 5432,
  "databaseName": "mydb",
  "username": "admin",
  "dbType": "POSTGRESQL",
  "displayName": "Production DB"
}
```

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `host` | string | ✅ | DB sunucu adresi |
| `port` | int | ✅ | 1–65535 |
| `databaseName` | string | ✅ | Veritabanı adı |
| `username` | string | ✅ | DB kullanıcı adı |
| `dbType` | enum | ✅ | `POSTGRESQL` / `MYSQL` / `MSSQL` / `ORACLE` |
| `displayName` | string | ❌ | Görünen ad |

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Database connection created. Please verify from your agent.",
  "data": {
    "id": "uuid",
    "deviceId": "uuid",
    "host": "localhost",
    "port": 5432,
    "databaseName": "mydb",
    "username": "admin",
    "dbType": "POSTGRESQL",
    "status": "PENDING",
    "displayName": "Production DB",
    "lastError": null,
    "createdAt": "2026-03-16T09:00:00",
    "verifiedAt": null,
    "lastUsedAt": null
  }
}
```

**Bağlantı Durumları (`status`):**

| Değer | Görüntü |
|---|---|
| `PENDING` | ⏳ Bekliyor |
| `VERIFIED` | ✅ Doğrulandı |
| `FAILED` | ❌ Başarısız |

---

#### `GET /api/devices/databases`
Kullanıcının tüm DB bağlantılarını listeler.

**Response (200):** `data: DatabaseConnectionResponse[]`

---

#### `GET /api/devices/databases/{id}`
Tek bağlantı detayı.

**Response (200):** `data: DatabaseConnectionResponse`

---

#### `PUT /api/devices/databases/{id}`
Bağlantı güncelleme. Bağlantı bilgileri değiştirilirse status `PENDING`'e döner.

**Request Body:**
```json
{
  "host": "new-host",
  "port": 5432,
  "databaseName": "newdb",
  "username": "newuser",
  "dbType": "MYSQL",
  "displayName": "Updated DB"
}
```

---

#### `DELETE /api/devices/databases/{id}`
Bağlantı silme.

**Response (200):** `{ "message": "Database connection deleted" }`

---

### 3.5 DB Service — Sorgu Yürütme `/api/devices/queries`

#### `POST /api/devices/queries/execute?databaseId={uuid}`
Ham SQL çalıştırır. Agent üzerinden proxy'lenir.

**Request:**
```
Content-Type: text/plain

SELECT id, name FROM users WHERE active = true LIMIT 50
```

**Response (200) — Başarılı:**
```json
{
  "success": true,
  "message": "Query executed successfully",
  "data": {
    "requestId": "uuid",
    "databaseId": "uuid",
    "originalQuery": "SELECT id, name FROM users...",
    "success": true,
    "data": [
      { "id": 1, "name": "Ahmet" },
      { "id": 2, "name": "Mehmet" }
    ],
    "rowCount": 2,
    "executionTimeMs": 143,
    "error": null,
    "errorCode": null
  }
}
```

**Response (200) — Hata (success: false):**
```json
{
  "data": {
    "success": false,
    "error": "Agent is not connected. Please start your agent and try again.",
    "errorCode": "AGENT_DISCONNECTED"
  }
}
```

> [!WARNING]
> HTTP 200 gelse bile `data.success: false` olabilir. Her sorgu sonucunda mutlaka `data.success` kontrol edilmeli.

**Hata Kodları:**

| Kod | Sebep |
|---|---|
| `AGENT_DISCONNECTED` | Agent çalışmıyor |
| `TIMEOUT` | 60 sn içinde cevap gelmedi |
| `QUERY_ERROR` | SQL hatası |
| `UNKNOWN` | Bilinmeyen hata |

---

#### `POST /api/devices/queries/natural-language?databaseId={uuid}`
Doğal dil sorusuna göre SQL üretip çalıştırır (AI ile).

**Request Body:**
```json
{
  "question": "Son 7 günde kayıt olan kullanıcıları listele"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Natural language query processed",
  "data": {
    "databaseId": "uuid",
    "question": "Son 7 günde kayıt olan kullanıcıları listele",
    "generatedSql": "SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '7 days'",
    "success": true,
    "data": [ ... ],
    "rowCount": 12,
    "executionTimeMs": 521,
    "error": null,
    "errorCode": null
  }
}
```

---

#### `POST /api/devices/queries/test/{databaseId}`
`SELECT 1` çalıştırarak bağlantıyı test eder.

**Response:** `QueryExecutionResponse` (yukarıdaki aynı yapı)

---

### 3.6 Genel API Yanıt Zarfı

Tüm servisler (DB Service & User Service) şu formatta yanıt verir:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "İşlem başarılı",
  "data": { ... }
}
```

Hata durumunda:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Hata mesajı",
  "data": null
}
```

Auth Service ise sadece `{ "message": "..." }` döner.

---

## 4. WebSocket Protokolü

Agent (masaüstü uygulama) ile server arasındaki WebSocket bağlantısı. **Frontend bu WebSocket'i kullanmaz**, ancak UI'da bağlantı durumunu göstermek için gerekli.

**WebSocket URL:** `ws://localhost:8080/ws/device?code={registryUUID}`  
*(Yeniden bağlanmak için:)* `ws://localhost:8080/ws/device?deviceId={deviceUUID}`

### Server → Agent Mesajları

| `type` | Açıklama |
|---|---|
| `EXECUTE_QUERY` | Agent'tan SQL çalıştırmasını ister |
| `VERIFY_DATABASE` | Yeni DB eklendikten sonra doğrulama isteği |
| `PING` | Canlılık kontrolü |

### Agent → Server Mesajları

| `type` | Açıklama |
|---|---|
| `DATABASE_VERIFIED` | DB başarıyla doğrulandı |
| `DATABASE_FAILED` | DB doğrulaması başarısız |
| `QUERY_RESULT` | Sorgu sonucu döndü |
| `QUERY_ERROR` | Sorgu hatası |
| `PONG` | Ping'e cevap |

**Bağlantı onay mesajı (server → agent, ilk bağlantıda):**
```json
{
  "type": "CONNECTION_CONFIRMED",
  "deviceId": "uuid",
  "userId": "uuid",
  "status": "ACTIVE",
  "connectedAt": "2026-03-16T09:00:00"
}
```

---

## 5. UX Yapısı & Sayfa Tasarım Önerileri

### 5.1 Önerilen Sayfa Akışı

```
Landing Page (/)
     │
     ├── /auth/register  →  Onboarding Flow
     │                        (1) Profil (2) Agent Kurulumu (3) DB Ekle
     │                              │
     │                              ▼
     └── /auth/login     →  Dashboard (/app)
```

---

### 5.2 Landing Page — `/`

**Amaç:** Şirkete ürünü tanıtmak, dönüşüm sağlamak.

**Bölümler (önerilen sıra):**
1. **Hero** — Ana başlık + kısa slogan + CTA butonu ("Ücretsiz Başla" → `/auth/register`)
2. **Ne Yapar?** — "Veritabanına doğal dil ile sor, SQL bilmene gerek yok" konseptini animasyonla anlat
3. **Nasıl Çalışır?** — 3 adımlı görsel: Bağlan → Sor → Sonucu Al
4. **Özellikler** — Desteklenen DB'ler (PostgreSQL, MySQL, MSSQL, Oracle), AI destekli sorgu, güvenli agent mimarisi (şifre hiç sunucuya gitmez vb.)
5. **Fiyatlandırma** — 3 plan (aşağıya bak, Bölüm 6)
6. **SSS**
7. **CTA** — Tekrar kayıt ol butonu
8. **Footer**

---

### 5.3 Auth Sayfaları — `/auth/register` & `/auth/login`

**Register Formu:**
```
Email         [___________________]
Şifre         [___________________]
Şifreyi Onayla [__________________]
              [  Kayıt Ol  ]
──────────────────────────────────
              [  Google ile Giriş ]
Zaten hesabın var mı? Giriş Yap
```

**Login Formu:**
```
Email         [___________________]
Şifre         [___________________]
              [  Giriş Yap  ]
──────────────────────────────────
              [  Google ile Giriş ]
Hesabın yok mu? Kayıt Ol
```

**Akış Notları:**
- Register başarılı olduğunda → `/onboarding` (profil doldurma)
- Login başarılı olduğunda → `GET /api/users/me` çağır
  - `404` gelirse → `/onboarding` (profil henüz oluşturulmamış)
  - `200` gelirse → `/app` (dashboard)

---

### 5.4 Onboarding Flow — `/onboarding`

**3 adımlı wizard (tek sayfa, step'ler arası geçiş):**

#### Adım 1: Profil Bilgileri
```
Ad           [___________________]
Soyad        [___________________]
Yaş          [___________________]
Cinsiyet     [ MALE ▼ ]
             [  İleri  ]
```
→ `POST /api/users` çağrısı başarılı olunca Adım 2'ye geç.

#### Adım 2: Agent Kurulumu
```
🖥️ Agent'ını Bağla

Agent uygulamasını bilgisayarına indir ve çalıştır.
Aşağıdaki kodu agent'ına gir:

┌──────────────────────────────────┐
│  550e8400-e29b-41d4-a716-...     │  [Kopyala]
└──────────────────────────────────┘

30 dakika içinde geçerlidir.
[Yenile]      [Bağlantıyı Kontrol Et]
```
- Sayfa açılınca `POST /api/devices/register` çağır, dönen `registryId`'yi göster.
- "Bağlantıyı Kontrol Et" → `GET /api/devices/check` çağır.
- Bağlantı onaylandığında otomatik Adım 3'e geç.

#### Adım 3: İlk Veritabanını Ekle
```
Görünen Ad    [___________________]  (opsiyonel)
Host          [___________________]
Port          [5432              ]
Veritabanı    [___________________]
Kullanıcı Adı [___________________]
DB Tipi       [ PostgreSQL ▼ ]

⚠️ Şifre bu formda istenmez. Agent'ın kendisi soracak.

              [  Ekle  ]  [  Atla  ]
```
→ `POST /api/devices/databases` başarılı olunca → `/app`

---

### 5.5 Dashboard — `/app`

**Önerilen Layout:** Sol sidebar + sağ içerik alanı (split-panel tasarım)

```
┌─────────────────┬──────────────────────────────────────┐
│  LOGO           │                                      │
│  ─────────────  │   [Aktif İçerik]                    │
│  📊 Dashboard   │                                      │
│  🗄️ Veritabanları│                                     │
│  💬 Sorgu       │                                      │
│  ⚙️ Ayarlar     │                                      │
│  ─────────────  │                                      │
│  👤 Profil      │                                      │
│  🚪 Çıkış       │                                      │
└─────────────────┴──────────────────────────────────────┘
```

**Alt Sayfalar:**

| Route | İçerik |
|---|---|
| `/app` | Dashboard (bağlantı istatistikleri, hızlı sorgu, son sorgular) |
| `/app/databases` | DB listesi, ekleme, durum (PENDING/VERIFIED/FAILED) |
| `/app/query` | Sorgu editörü (NL + SQL tab'ları) |
| `/app/settings` | Profil düzenleme, agent durumu |

---

### 5.6 Sorgu Sayfası — `/app/query`

**İki mod (tab ile geçiş):**

**Mod 1: Doğal Dil**
```
Veritabanı Seç  [ Production DB ▼ ]

Sorunuzu yazın:
┌────────────────────────────────────────────┐
│ Son 7 günde kayıt olan kullanıcıları göster │
└────────────────────────────────────────────┘
                [ 🔍 Sorgula ]

Üretilen SQL:
┌────────────────────────────────────────────┐
│ SELECT * FROM users WHERE created_at >= ... │
└────────────────────────────────────────────┘

Sonuçlar (12 satır, 521ms):
┌─────┬──────────┬─────────────────────┐
│ id  │ name     │ created_at          │
├─────┼──────────┼─────────────────────┤
│ 1   │ Ahmet    │ 2026-03-10T...      │
└─────┴──────────┴─────────────────────┘
```

**Mod 2: Ham SQL**
```
Veritabanı Seç  [ Production DB ▼ ]

┌────────────────────────────────────────────┐
│ SELECT *                                   │
│ FROM users                                 │
│ WHERE active = true                        │
└────────────────────────────────────────────┘
                [ ▶ Çalıştır ]
```

**UX Notları:**
- Agent bağlı değilse (`AGENT_DISCONNECTED`) → "Agent'ınız bağlı değil" uyarısı göster
- Sorgu 60 sn timeout'a uğrarsa (`TIMEOUT`) → açıklayıcı hata göster
- `data.success: false` durumunu daima kontrol et (HTTP 200 olsa bile)

---

## 6. Ödeme / Fiyatlandırma Planları

> Backend henüz ödeme sistemi içermemektedir. Aşağıdaki plan yapısı frontend tasarımı için önerimdir.

### Önerilen Plan Yapısı

```
┌──────────────┬─────────────────┬──────────────────┐
│   STARTER    │    BUSINESS     │    ENTERPRISE    │
│   Ücretsiz   │    ₺299/ay      │    ₺899/ay       │
├──────────────┼─────────────────┼──────────────────┤
│ 1 veritabanı │ 10 veritabanı  │ Sınırsız         │
│ 100 sorgu/ay │ 5.000 sorgu/ay  │ Sınırsız sorgu   │
│ PostgreSQL   │ Tüm DB tipleri  │ Tüm DB tipleri   │
│ Topluluk     │ E-posta destek  │ Öncelikli destek  │
│ desteği      │                 │ SLA garantisi    │
└──────────────┴─────────────────┴──────────────────┘
         [Başla]     [Hemen Al]      [Satışa Geç]
```

**Pricing Component Özellikleri:**
- Aylık / Yıllık toggle (yıllık %20 indirim gibi)
- Aktif plan highlight (örn: "Business" kartı büyük ve renkli)
- "En Popüler" badge (Business planı için)
- Her planın altında detaylı özellik listesi (✅ var, ❌ yok)
- CTA butonları: Starter=ücretsiz başla, Business=kredi kartı, Enterprise=satışla konuş

**Ödeme flow (ileride eklenecek):**
1. Plan seç → 
2. Stripe/iyzico ödeme formu ekranı →
3. Başarılı ödeme → dashboard'a yönlendir

---

## 7. Teknik Notlar

### 7.1 Axios / Fetch Interceptor Şablonu
```js
// axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // cookie'ler için zorunlu
});

// 401 gelince refresh token dene
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await api.post('/auth/refresh');
        return api(error.config); // orijinal isteği tekrar et
      } catch {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 7.2 Desteklenen Veritabanı Tipleri (Enum)
```
POSTGRESQL | MYSQL | MSSQL | ORACLE
```

### 7.3 Bağlantı Durumları (Enum)
```
PENDING   → Eklendi, agent doğrulaması bekleniyor
VERIFIED  → Kullanıma hazır
FAILED    → Doğrulama başarısız (lastError alanına bak)
```

### 7.4 Kullanıcı Cinsiyet Değerleri
```
MALE | FEMALE | OTHER
```

### 7.5 Onboarding Kontrol Akışı (Pseudocode)
```
login() → cookie set →
  GET /api/users/me
    → 200: user profili var → /app
    → 404: profil yok → /onboarding (Adım 1)

register() → cookie set →
  /onboarding (Adım 1) // her zaman profil adımına al
```

### 7.6 Agent Bağlantı Durumu Takibi
Agent bağlantı durumunu anlamak için:
- `GET /api/devices/check` → agent kayıt kodu var mı?
- `POST /api/devices/queries/test/{databaseId}` → aktif mi?
- Cevap `errorCode: "AGENT_DISCONNECTED"` ise → uyarı göster

---

## 8. Servis Port Referansı (Geliştirme Ortamı)

| Servis | Port | Açıklama |
|---|---|---|
| Gateway | 8080 | **Frontend bu port ile konuşur** |
| Auth Service | 8081 | `/auth/**` |
| User Service | 8082 | `/api/users/**` |
| DB Service | 8083 | `/api/devices/**`, `/ws/**` |
| Fast Service | 8000 | Internal (frontend erişmez) |

