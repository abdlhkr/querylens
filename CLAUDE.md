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
```

### FastAPI service (Fast-Service)
```bash
cd Fast-Service
# Activate venv first if using one
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

### Authentication Flow
- Auth service issues **HttpOnly cookies** (`access_token`, `refresh_token`) — no Bearer header.
- Gateway's `JwtClaimsToHeadersFilter` reads the `access_token` cookie, validates JWT, and injects `X-User-Id`, `X-User-Role`, `X-User-Email` headers for downstream services. Downstream services trust these headers without re-validating the JWT.
- JWT secret must be identical in both `auth-service` and `gateway-service` `application.properties`.
- Refresh tokens are stored in the `auth-postgres` DB (`RefreshToken` entity). On logout or re-login, the old refresh token is invalidated.
- Google OAuth2 callback is registered on port **8080** (gateway), not 8081. The gateway forwards `/oauth2/**` and `/login/oauth2/**` to the auth service.

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

## Environment Variables

Root `.env` is used by docker-compose:
- `OPENAI_API_KEY` — required by fast-service

Service-level `.env` files exist for local development in `Fast-Service/.env` and `front-app/.env`.

## Java Version

All Spring Boot services target **Java 17**. Gateway uses Spring Boot 3.2 / Spring Cloud 2023.0.1; Auth and User use Spring Boot 4.0.
