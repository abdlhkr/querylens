# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SaaS platform built with a microservices architecture. The system lets users connect their own databases via an agent, then query those databases using natural language (converted to SQL by an AI service).

## Services

| Service | Path | Port | Tech |
|---|---|---|---|
| gateway-service | `gateway-service/gateway-service` | 8080 | Spring Boot 3.2 + Spring Cloud Gateway (reactive) |
| auth-service | `Auth/Auth` | 8081 | Spring Boot 4.0 + Spring Security + JWT |
| user-service | `User/user` | 8082 | Spring Boot 4.0 |
| db-service (database-initialization) | `database-initialization/database-initialization` | 8083 | Spring Boot |
| fast-service | `Fast-Service` | 8000 | FastAPI + LangChain + OpenAI |
| front-app | `front-app` | 5173 | React 19 + TypeScript + Vite |
| node-websocket-agent | `agent/node-websocket-agent` | — | Node.js |

Infrastructure: PostgreSQL (3 separate DBs on ports 5433/5434/5435), Redis on 6379.

## Running the Full Stack

```bash
# From repo root — requires .env with OPENAI_API_KEY
docker compose up --build
```

Each Spring Boot service is built with its own Maven wrapper inside the service directory (e.g. `Auth/Auth/mvnw`).

## Building & Running Individual Services

### Spring Boot services (Auth, User, gateway-service, database-initialization)
```bash
# From the service's inner directory (e.g. Auth/Auth/)
./mvnw spring-boot:run

# Build fat JAR
./mvnw package -DskipTests

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=ClassName

# Run a single test method
./mvnw test -Dtest=ClassName#methodName
```

### FastAPI service (Fast-Service)
```bash
cd Fast-Service
uvicorn main:app --reload --port 8000
```

### Frontend (front-app)
```bash
cd front-app
npm install
npm run dev       # dev server on :5173
npm run build     # type-check + Vite build
npm run lint      # ESLint
```

### Node WebSocket Agent (agent/node-websocket-agent)
```bash
cd agent/node-websocket-agent
npm install
cp .env.example .env  # then fill in values
npm start             # production
npm run dev           # with nodemon
npm test              # connection tests
```

## Architecture & Key Design Decisions

### Database Ownership (3 separate PostgreSQL instances)
- **auth-postgres** (5433): `UserCredentials`, `RefreshToken`, `VerificationCode` — owned exclusively by auth-service.
- **user-postgres** (5434): `User` (profile data: name, age, gender) — owned by user-service. The `User.id` UUID matches `UserCredentials.id` in auth-postgres; they are linked by convention, not a foreign key.
- **db-postgres** (5435): `Device`, `CreateDeviceRegistry`, `DatabaseConnection`, `IntrospectionResult` — owned by db-service.

There is no cross-service DB access. Inter-service communication happens only via HTTP headers injected by the gateway.

### Authentication Flow
- Auth service issues **HttpOnly cookies** (`access_token`, `refresh_token`) — no Bearer header.
- Gateway's `JwtClaimsToHeadersFilter` reads the `access_token` cookie, validates JWT, and injects `X-User-Id`, `X-User-Role`, `X-User-Email` headers for downstream services. Downstream services trust these headers without re-validating the JWT.
- JWT secret must be identical in both `auth-service` and `gateway-service` `application.properties`.
- Refresh tokens are stored in the `auth-postgres` DB (`RefreshToken` entity). On logout or re-login, the old refresh token is invalidated.
- Google OAuth2 callback is registered on port **8080** (gateway), not 8081. The gateway forwards `/oauth2/**` and `/login/oauth2/**` to the auth service.
- The gateway skips JWT validation for: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/ws/device`, `/login/oauth2/`, `/oauth2/`. All `/api/` paths require a valid token cookie.

### Two-Step OTP Flow Pattern
Login, register, and several account operations use a two-step flow: initiate → verify. The `VerificationCode` entity stores a 6-digit code per `(email, ConfType)`. Current `ConfType` values: `REGISTER`, `LOGIN`, `SET_PASSWORD`, `CHANGE_EMAIL`, `FORGOT_PASSWORD`. Adding a new flow requires adding a new `ConfType` value and calling `verificationCodeService.generateAndSend(email, ConfType.NEW_TYPE)`.

### Account Management (auth-service AccountController)
`AccountController` at `/auth/account/**` reads `X-User-Id` from the header and does a manual null check (unlike most controllers that declare `@RequestHeader` as required). Endpoints: `GET /status`, `POST /send-set-password-code`, `POST /set-password`, `POST /send-change-email-code`, `POST /change-email`.

### Rate Limiting
- Implemented in `gateway-service` via Redis-backed `RequestRateLimiter` on the `/auth/**` route (2 req/s replenish, 5 burst, 3 tokens/request).
- Rate limit key resolver is IP-based (`@ipKeyResolver` bean in `RateLimiterConfig`).

### Agent ↔ Backend WebSocket Protocol
- Devices (Node.js agents) connect over WebSocket at `/ws/device/{registryId}`.
- Auth for WebSocket is done via `DeviceAuthInterceptor` using the registry ID.
- After connecting, `db-service` pushes `NEW_DATABASE` messages to the agent with connection info (without passwords). The agent attempts the DB connection and replies with `DATABASE_VERIFIED` or `DATABASE_FAILED`.
- Natural language queries flow: frontend → db-service → fast-service (LLM) → generates SQL → db-service forwards to agent via WebSocket → agent runs query on user's DB → result returns via WebSocket.

### Fast-Service (AI SQL Generation)
- Uses LangChain + `gpt-4o-mini` (singleton via `get_llm()`).
- Accepts `QueryRequest` with `question`, `db_type`, and `db_scheme`; returns only a SELECT SQL string.
- Strict system prompt enforces: SELECT-only, schema-prefixed table names (e.g. `public.users`), no DDL/DML.

### User Identity
- User IDs are UUIDs propagated as the `X-User-Id` header from the gateway. Services do not maintain their own auth — they rely on this header.
- Each user can have at most one registered device (agent). Device registration uses a one-time registry code.

### Frontend Architecture
- **State**: Zustand with `persist` middleware (`user-profile` localStorage key) — see `store/userStore.ts`.
- **API layer**: Axios client in `api/client.ts` with `withCredentials: true` (cookies). Domain APIs split into `api/auth.ts`, `api/users.ts`, `api/devices.ts`.
- **Routing**: React Router v6 with lazy-loaded pages and two guards (`ProtectedRoute`, `PublicOnlyRoute`) in `router/guards.tsx`. Stale chunk detection auto-reloads the page.
- **i18n**: `react-i18next` with `tr` and `en` namespaces in `src/i18n/`. All UI strings live in the translation files; adding a new string requires updating both `tr.ts` and `en.ts`.
- **UI**: CSS Modules co-located with pages (e.g., `Settings.css` next to `Settings.tsx`). Icons from `lucide-react`. Toast notifications via `react-hot-toast`.

### Cross-Service Account Deletion
Currently, `DELETE /api/users` (user-service) only deletes the `User` profile row. The `UserCredentials` record in auth-service and the `Device`/`DatabaseConnection` records in db-service are not deleted. A complete account deletion must coordinate across all three services.

## Environment Variables

Root `.env` is used by docker-compose:
- `OPENAI_API_KEY` — required by fast-service

Service-level `.env` files exist for local development in `Fast-Service/.env` and `front-app/.env`.

## Java Version

All Spring Boot services target **Java 17**. Gateway uses Spring Boot 3.2 / Spring Cloud 2023.0.1; Auth and User use Spring Boot 4.0.
