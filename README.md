<div align="center">

# QueryLens

**Kendi veritabanını bağla, doğal dille sorgula.**

Kullanıcı kendi veritabanını (PostgreSQL / MySQL / MSSQL / SQLite) sunucuya açmadan,
kendi makinesinde çalışan bir agent üzerinden bağlar; sorularını Türkçe/İngilizce yazar,
sistem şemayı RAG ile bulup güvenli bir `SELECT` sorgusuna çevirir ve sonucu geri döner.
Veri asla platformun veritabanında saklanmaz — sorgu kullanıcının kendi makinesinde çalışır.

![Status](https://img.shields.io/badge/canl%C4%B1%20demo-yok%20%E2%80%94%20sunucu%20kapal%C4%B1-lightgrey?style=for-the-badge)
![Run](https://img.shields.io/badge/lokal%20kurulum-docker%20compose%20up-2496ED?style=for-the-badge&logo=docker&logoColor=white)

> Şu anda yayında bir demo ortamı yok — proje tamamen lokalde, tek komutla ayağa kaldırılabilir.
> Kod tabanı production dağıtımına hazırdır (`docker-compose.yml` prod ayarlarını, `docker-compose.override.yml` lokal ayarları tutar).

</div>

---

## Tech Stack

**Backend**

![Java](https://img.shields.io/badge/Java%2017-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot%204-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Cloud Gateway](https://img.shields.io/badge/Spring%20Cloud%20Gateway-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT%20(HttpOnly)-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

**Frontend**

![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-2D3748?style=for-the-badge&logo=redux&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router%207-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![i18next](https://img.shields.io/badge/i18next%20(TR%2FEN)-26A69A?style=for-the-badge&logo=i18next&logoColor=white)

**AI / Data**

![Python](https://img.shields.io/badge/Python%203.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI%20gpt--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)
![Weaviate](https://img.shields.io/badge/Weaviate%20(RAG)-00C9A7?style=for-the-badge&logo=weaviate&logoColor=white)

**Data & Infra**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL%2015%20x3-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis%207-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js%2020-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

---

## Teknoloji & Sorumluluk Tablosu

| Katman / Servis | Teknoloji | Neden / Hangi Amaçla Kullanıldı? |
|---|---|---|
| **gateway-service** `:8080` | Spring Boot 3.2 + Spring Cloud Gateway (reactive) | Tek giriş noktası; `access_token` cookie'sindeki JWT'yi doğrulayıp `X-User-Id` / `X-User-Role` / `X-User-Email` header'larını downstream servislere enjekte eder. |
| **Rate limiting** | Redis 7 + `RequestRateLimiter` | `/auth/**` rotasında IP bazlı istek sınırı (2 req/s, 5 burst) ile brute-force ve OTP spam'ini engeller. |
| **auth-service** `:8081` | Spring Boot 4.0 + Spring Security + JJWT | Kayıt/giriş, iki adımlı OTP doğrulama, Google OAuth2, refresh token rotasyonu; token'ları **HttpOnly cookie** olarak yazar (XSS'e karşı Bearer header kullanılmaz). |
| **user-service** `:8082` | Spring Boot 4.0 + JPA | Profil verisi (isim, yaş, cinsiyet) — kimlik doğrulama yapmaz, gateway'in bastığı header'a güvenir. |
| **db-service** `:8083` | Spring Boot + Spring WebSocket | Cihaz (agent) kaydı, veritabanı bağlantı tanımları, şema introspection sonuçları; agent ile WebSocket üzerinden konuşan orkestratör. |
| **fast-service** `:8000` | FastAPI + LangChain + `gpt-4o-mini` | Doğal dili SQL'e çeviren AI katmanı; sistem prompt'u yalnızca `SELECT` üretmeye ve şema öneki (`public.users`) kullanmaya zorlar, DDL/DML üretimini yasaklar. |
| **RAG katmanı** | Weaviate 1.27 + `text2vec-openai` | Kullanıcı şemasındaki tablo metadata'sı vektörlenir; soruya göre hybrid search ile **yalnızca ilgili tablolar** LLM'e verilir — büyük şemalarda context şişmesini önler. |
| **node-websocket-agent** | Node.js 20 + `ws` + `pg` / `mysql2` / `mssql` / `sql.js` | Kullanıcının kendi makinesinde çalışır; DB'yi internete açmadan sorguyu lokalde çalıştırıp sonucu WebSocket ile geri gönderir. Kimlik bilgileri lokal şifreli dosyada tutulur. |
| **front-app** `:5173` / `:3000` | React 19 + TypeScript + Vite 8 | Chat arayüzü, Monaco ile SQL görüntüleme, Recharts ile sonuç grafikleri; Zustand + `persist` ile oturum durumu, axios `withCredentials` ile cookie tabanlı auth. |
| **i18n** | react-i18next | Tüm UI metinleri `tr` / `en` namespace'lerinde; hardcoded string yok. |
| **Veritabanları** | PostgreSQL 15 × 3 (`5433` / `5434` / `5435`) | Servis başına izole veritabanı — cross-service DB erişimi yok, sınırlar HTTP üzerinden korunur. |
| **Dağıtım** | Docker Compose + Nginx | Tüm stack tek komutla ayağa kalkar; frontend multi-stage build sonrası Nginx ile statik servis edilir. |

---

## Mimari & Veri Akışı

```
                        ┌──────────────────────────────┐
                        │   Browser (React 19 + Vite)  │
                        │   Nginx :3000  /  dev :5173  │
                        └───────────────┬──────────────┘
                                        │ HTTPS + HttpOnly cookie
                                        ▼
        ┌───────────────────────────────────────────────────────────┐
        │            gateway-service  :8080  (Spring Cloud)         │
        │   JWT doğrula ──► X-User-Id / X-User-Role / X-User-Email  │
        │   Rate limit ◄──────────────────────────────► Redis :6379 │
        └───┬─────────────────┬──────────────────┬──────────────────┘
            │                 │                  │
            ▼                 ▼                  ▼
   ┌────────────────┐ ┌───────────────┐ ┌──────────────────────────┐
   │  auth-service  │ │ user-service  │ │      db-service :8083    │
   │     :8081      │ │    :8082      │ │  cihaz + bağlantı + şema │
   └───────┬────────┘ └───────┬───────┘ └───┬──────────────────┬───┘
           │                  │             │                  │
           ▼                  ▼             ▼                  │ HTTP
  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐     │
  │ auth-postgres  │ │ user-postgres  │ │ device-postgres│     │
  │     :5433      │ │     :5434      │ │     :5435      │     │
  └────────────────┘ └────────────────┘ └────────────────┘     │
                                                                ▼
                                              ┌──────────────────────────────┐
                                              │    fast-service :8000        │
                                              │  FastAPI + LangChain         │
                                              │  ① RAG: ilgili tabloları bul │◄──► Weaviate :8085
                                              │  ② NL ─► güvenli SELECT SQL  │◄──► OpenAI API
                                              └──────────────────────────────┘

   ── Sorgu akışı ────────────────────────────────────────────────────────────
   Kullanıcı sorusu → gateway → db-service → fast-service (RAG + SQL üretimi)
        → db-service → WebSocket → agent → KULLANICININ KENDİ DB'Sİ
        → sonuç → WebSocket → db-service → gateway → arayüz

                    ┌───────────────────────────────────────┐
       WS           │   node-websocket-agent (kullanıcı PC) │
   /ws/device/{id}  │   pg · mysql2 · mssql · sql.js        │
   ◄────────────────┤   sorguyu LOKAL çalıştırır            │
                    └───────────────────┬───────────────────┘
                                        ▼
                            Kullanıcının kendi veritabanı
                              (asla dışarı açılmaz)
```

---

## Hızlı Başlangıç

### 1. Tüm stack — tek komut

```bash
git clone <repo-url> && cd Start
# repo kökünde .env oluştur (aşağıdaki değişkenlerle)
docker compose up --build
```

`.env`:

```bash
OPENAI_API_KEY=sk-...
JWT_SECRET=<auth ve gateway için AYNI secret>
DB_PASSWORD=123456
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
```

> `docker-compose.override.yml` otomatik yüklenir ve lokal geliştirme için CORS / cookie / OAuth redirect ayarlarını `localhost`'a çevirir.

Arayüz: **http://localhost:3000** · API: **http://localhost:8080**

### 2. Agent'ı kullanıcı makinesinde çalıştır

```bash
cd agent/node-websocket-agent
npm install
# .env oluştur: registry ID + gateway WebSocket URL
npm start
```

### 3. Tek tek servis geliştirme

```bash
# Spring Boot servisleri (Auth/Auth, User/user, gateway-service/..., database-initialization/...)
./mvnw spring-boot:run
./mvnw test -Dtest=ClassName#methodName

# FastAPI
cd Fast-Service && uvicorn main:app --reload --port 8000

# Frontend
cd front-app && npm install && npm run dev     # :5173
```

---

## Güvenlik Notları

- Token'lar **HttpOnly cookie**; JS erişemez, Bearer header yok.
- JWT doğrulaması yalnızca gateway'de yapılır; downstream servisler yalnızca özel ağ içinden erişilebilir olmalıdır.
- LLM çıktısı prompt seviyesinde `SELECT`-only'ye kısıtlanır; DDL/DML üretimi reddedilir.
- Veritabanı kimlik bilgileri platforma değil, agent'ın çalıştığı makineye şifreli olarak yazılır.
