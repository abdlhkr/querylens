# glibc tabanli imaj: package-lock.json'daki native binary'ler (rolldown,
# lightningcss) linux-x64-gnu icin cozulmus durumda. Alpine (musl) ile
# "npm ci" bu binding'leri bulamaz.
FROM node:20-slim AS builder

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package.json package-lock.json ./
# npm ci: lockfile'daki tam surumleri kurar. "npm install" her build'de
# ^ araliklarini yeniden cozup kirik bir upstream surum cekebiliyordu.
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
