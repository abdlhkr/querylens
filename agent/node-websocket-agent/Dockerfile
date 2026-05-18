# ── Stage 1: Build (obfuscate) ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src/ ./src/
RUN npm run obfuscate

RUN npm install --omit=dev

RUN mkdir -p /app/data /app/logs

# ── Stage 2: Production (distroless — no shell, no tools) ────────────────────
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./src
COPY --from=builder /app/data ./data
COPY --from=builder /app/logs ./logs

ENV DATA_DIR=/app/data
ENV LOG_FILE=/app/logs/agent.log
ENV NODE_ENV=production
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

CMD ["src/index.js"]
