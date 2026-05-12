FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/

RUN mkdir -p /app/data /app/logs

ENV DATA_DIR=/app/data
ENV LOG_FILE=/app/logs/agent.log
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
