# syntax=docker/dockerfile:1

# --- API: dependency install (production) ---
FROM node:20-alpine AS api-deps
# Avoid extra registry round-trips and long silent downloads during `npm ci` in Docker.
ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_fetch_timeout=120000 \
    npm_config_fetch_retries=5
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund --loglevel=info

# --- API: runtime ---
FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api-deps /app/node_modules ./node_modules
COPY server/ ./
RUN chmod +x scripts/entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["./scripts/entrypoint.sh"]

# --- Web: build React ---
FROM node:20-alpine AS web-build
ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_fetch_timeout=120000 \
    npm_config_fetch_retries=5
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --loglevel=info
COPY client/ ./
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Web: static assets (minimal) ---
FROM nginx:1.27-alpine AS web
COPY docker/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /client/dist /usr/share/nginx/html
EXPOSE 3000
