# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

A SaaS microservices platform with four main services:

```
start/
├── Auth/              # Authentication service (port 8081)
│   └── src/main/java/Kara/Auth/
├── User/              # User management service (port 8082)
│   └── src/main/java/kara/saas/
├── gateway-service/   # API Gateway (port 8080)
│   └── src/main/java/com/bosbeles/gateway_service/
└── database-initialization/  # Database management service (port 8083)
    └── src/main/java/saas/database_initialization/
```

## Technology Stack

- **Java 17** with **Spring Boot 3.2.5-4.0.2**
- **Maven** for builds
- **Spring Security** + **JWT** for authentication
- **Spring Cloud Gateway** for routing
- **PostgreSQL** with **JPA/Hibernate**
- **OAuth2** (Google) support
- **WebSocket** for real-time database operations

## Build & Run

Each service uses Maven Wrapper (`mvnw`):

```bash
# Build all services
./Auth/Auth/mvnw clean package
./User/user/mvnw clean package
./gateway-service/gateway-service/mvnw clean package
./database-initialization/database-initialization/mvnw clean package

# Run a service
./Auth/Auth/mvnw spring-boot:run
./User/user/mvnw spring-boot:run
./gateway-service/gateway-service/mvnw spring-boot:run
./database-initialization/database-initialization/mvnw spring-boot:run
```

## Architecture Notes

**Authentication Flow:**
1. Gateway (`8080`) receives requests and validates JWT from `access_token` cookie
2. `JwtClaimsToHeadersFilter` extracts claims and injects `X-User-Id`, `X-User-Role`, `X-User-Email` headers
3. Auth service (`8081`) handles `/auth/**`, `/oauth2/**`, `/login/oauth2/**` routes
4. OAuth2 redirect URIs point to gateway (`8080`) which forwards to auth service

**User Service:**
- Runs on port `8082`
- Uses `SecurityFilter` to validate `X-User-Id` header from gateway
- User ID comes from JWT token, not request body

**Database Initialization Service:**
- WebSocket-based real-time database operations
- Integrates with external `fast-service` for natural language SQL generation
- Handles device registration and database connection management

## Common Commands

- **Test:** `./mvnw test`
- **Run with specific port:** `SERVER_PORT=8081 ./Auth/Auth/mvnw spring-boot:run`
- **Build JAR:** `./mvnw clean package -DskipTests`
