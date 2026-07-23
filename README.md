# Mailflow

A full-stack email processing platform built to demonstrate asynchronous job queues, background workers, real-time monitoring, authentication, and production-ready engineering practices.

> Status: actively under development.

## Current features

- React + TypeScript + Tailwind CSS dashboard
- React Router, Redux Toolkit, and TanStack Query foundation
- Fastify API with structured Pino logs
- PostgreSQL running in Docker
- Prisma ORM and versioned database migrations
- JWT authentication
- Argon2id password hashing
- Health endpoint with PostgreSQL connectivity check

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Redux Toolkit
- TanStack Query

### Backend

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Pino logging
- Zod validation
- JWT authentication
- Argon2id password hashing

## Prerequisites

Install these tools before starting:

- Node.js `22.12+`
- npm
- Docker Desktop
- Git

Verify your installation:

```powershell
node -v
npm -v
docker --version
git --version
```

## Local setup

### 1. Clone the repository

```powershell
git clone YOUR_REPOSITORY_URL
cd mailflow
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure environment variables

Copy the API example environment file:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Generate a secure JWT secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Open `apps/api/.env` and replace the `JWT_SECRET` placeholder with the generated value.

Your local file should contain:

```env
PORT=3001
WEB_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
DATABASE_URL="postgresql://mailflow:mailflow_dev_password@localhost:5432/mailflow?schema=public"
JWT_SECRET=your-generated-secret-here
```

Never commit `.env` files.

### 4. Start PostgreSQL

```powershell
docker compose up -d postgres
docker compose ps
```

The PostgreSQL container should become healthy.

### 5. Apply database migrations

```powershell
cd apps\api
npx prisma migrate dev --config .\prisma.config.ts
npx prisma generate --config .\prisma.config.ts
cd ..\..
```

### 6. Start the API

Open a terminal in the project root:

```powershell
npm run dev -w @mailflow/api
```

The API runs at:

```text
http://localhost:3001
```

Verify it:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Expected response:

```text
status   : ok
service  : api
database : ok
```

### 7. Start the frontend

Open a second terminal in the project root:

```powershell
npm run dev -w @mailflow/web
```

Open:

```text
http://localhost:5173
```

## Authentication endpoints

### Register

```http
POST /api/auth/register
```

Example body:

```json
{
  "email": "user@example.com",
  "name": "Demo User",
  "password": "VeryStrongPassword123!"
}
```

### Login

```http
POST /api/auth/login
```

### Current user

```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

## Useful commands

```powershell
# Type-check the API
npm run typecheck -w @mailflow/api

# Build the frontend
npm run build -w @mailflow/web

# View PostgreSQL container status
docker compose ps

# Stop containers but keep local database data
docker compose down

# Stop containers and delete local database data
docker compose down -v
```

> Warning: `docker compose down -v` deletes your local PostgreSQL data.

## Project structure

```text
mailflow/
├─ apps/
│  ├─ web/              # React frontend
│  └─ api/              # Fastify API and Prisma schema
├─ docs/                # Architecture and learning documentation
├─ infra/               # Future infrastructure files
├─ compose.yml          # Local PostgreSQL container
└─ package.json         # npm workspaces configuration
```

## Roadmap

- [x] Frontend foundation
- [x] PostgreSQL + Prisma
- [x] Authentication
- [ ] Campaign management
- [ ] Redis + BullMQ queues
- [ ] Separate email worker
- [ ] Retry, backoff, and dead-letter queue
- [ ] Real-time job monitoring
- [ ] Scheduled campaigns
- [ ] Testing and GitHub Actions
- [ ] Sentry, Docker production setup, and deployment
