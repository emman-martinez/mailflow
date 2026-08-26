# Install workspace dependencies
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

# Build the worker
FROM dependencies AS build

WORKDIR /app

COPY apps/api apps/api
COPY apps/worker apps/worker

# Temporary URL used only for Prisma client generation.
ENV DATABASE_URL=postgresql://mailflow:build-only@localhost:5432/mailflow

RUN npx prisma generate --config apps/api/prisma.config.ts
RUN npm run build -w @mailflow/worker

# Production runtime
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/worker/dist ./apps/worker/dist

COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/package.json

CMD ["node", "apps/worker/dist/worker.js"]
