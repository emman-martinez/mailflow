# Build dependencies
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

# Build API
FROM dependencies AS build

WORKDIR /app

COPY apps/api apps/api

# Prisma only needs this temporary URL while generating the client.
ENV DATABASE_URL=postgresql://mailflow:build-only@localhost:5432/mailflow

RUN npx prisma generate --config apps/api/prisma.config.ts
RUN npm run build -w @mailflow/api

# Production runtime
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
