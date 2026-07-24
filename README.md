# Mailflow

A full-stack email campaign platform built to demonstrate asynchronous job queues, background workers, real-time monitoring, authentication, and production-ready engineering practices.

> Status: actively under development. Redis is running locally; the next milestone is adding BullMQ and the first queue producer.

## Current features

- React + TypeScript + Tailwind CSS dashboard
- Global light and dark theme with Redux Toolkit
- React Router, Redux Toolkit, TanStack Query, and Axios foundation
- Fastify API with structured Pino logs
- PostgreSQL and Redis running in Docker
- Prisma ORM and versioned database migrations
- JWT authentication and Argon2id password hashing
- Health endpoint with PostgreSQL connectivity check
- Authenticated campaign creation and campaign retrieval endpoints
- PostgreSQL models for campaigns, email jobs, and audit logs
- Prisma Studio instructions for visually inspecting local data

## Tech stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Redux Toolkit
- TanStack Query
- Axios

### Backend and infrastructure

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Redis
- Pino logging
- Zod validation
- JWT authentication
- Argon2id password hashing
- Docker Compose

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

Open `apps/api/.env` and replace the `JWT_SECRET` placeholder with the generated value. Your local file should contain:

```env
PORT=3001
WEB_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
DATABASE_URL="postgresql://mailflow:mailflow_dev_password@localhost:5432/mailflow?schema=public"
JWT_SECRET=your-generated-secret-here
REDIS_URL=redis://localhost:6379
```

Never commit `.env` files.

### 4. Start PostgreSQL and Redis

```powershell
docker compose up -d
docker compose ps
docker compose exec redis redis-cli ping
```

Both containers should become healthy. The final command should return `PONG`.

> Redis is used by BullMQ in the upcoming queue and worker milestones. It does not contain jobs until the application starts enqueueing them.

### 5. Apply database migrations

```powershell
cd apps\api
npx prisma migrate dev --config .\prisma.config.ts
npx prisma generate --config .\prisma.config.ts
cd ..\..
```

### 6. Explore the database with Prisma Studio (optional)

Prisma Studio is a local web interface for browsing and editing PostgreSQL data without writing SQL. It is useful for inspecting users, campaigns, jobs, and audit logs as the application grows.

```powershell
cd apps\api
npx prisma studio --config .\prisma.config.ts --port 51212
```

Open [http://localhost:51212](http://localhost:51212), then select a table such as `User` to inspect its records. Press `Ctrl + C` in the Prisma Studio terminal to stop it.

> Do not edit `passwordHash` values manually. Passwords are intentionally stored as secure hashes, never as plain text.

### 7. Start the API

Open a terminal in the project root:

```powershell
npm run dev -w @mailflow/api
```

The API runs at `http://localhost:3001`.

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

### 8. Start the frontend

Open a second terminal in the project root:

```powershell
npm run dev -w @mailflow/web
```

Open `http://localhost:5173`.

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

## Campaign endpoints

All campaign endpoints require this header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Create a campaign

```http
POST /api/campaigns
```

Example body:

```json
{
  "name": "July product update",
  "subject": "New features in Mailflow",
  "body": "Hello! Here is our latest update.",
  "recipients": ["first@example.com", "second@example.com"]
}
```

### List your campaigns

```http
GET /api/campaigns
```

### Get one campaign and its jobs

```http
GET /api/campaigns/:campaignId
```

Use Postman (or another API client) to register, log in, save the JWT token as an environment variable, and send it as a Bearer token. The campaign endpoint currently saves campaign and email-job records in PostgreSQL. A later milestone will also enqueue each email job in BullMQ.

## Useful commands

```powershell
# Type-check the API
npm run typecheck -w @mailflow/api

# Build the frontend
npm run build -w @mailflow/web

# Open the visual database browser
cd apps\api
npx prisma studio --config .\prisma.config.ts --port 51212
cd ..\..

# View container status
docker compose ps

# Verify that Redis is reachable
docker compose exec redis redis-cli ping

# Stop containers but keep local database and Redis data
docker compose down

# Stop containers and delete local database and Redis data
docker compose down -v
```

> Warning: `docker compose down -v` deletes your local PostgreSQL and Redis data.

## Project structure

```text
mailflow/
├── apps/
│   ├── web/              # React frontend
│   ├── api/              # Fastify API and Prisma schema
│   └── worker/           # Future background worker service
├── docs/                 # Architecture and learning documentation
├── infra/                # Future infrastructure files
├── compose.yml           # Local PostgreSQL and Redis containers
└── package.json          # npm workspaces configuration
```

## Roadmap

- [x] Frontend foundation
- [x] Global light and dark theme
- [x] PostgreSQL + Prisma database design
- [x] Authentication and protected API routes
- [x] Axios frontend authentication flow
- [x] Campaign management API and Postman collection workflow
- [x] Local Redis Docker service
- [ ] BullMQ email queue producer
- [ ] Separate email worker
- [ ] Retry, backoff, and dead-letter queue
- [ ] Real-time job monitoring
- [ ] Scheduled campaigns
- [ ] Email-provider integration and safe development mail testing
- [ ] Backend, frontend, and end-to-end tests
- [ ] Structured error logs and Sentry monitoring
- [ ] Docker production setup, GitHub Actions, and deployment
- [ ] Architecture diagrams, screenshots, and portfolio case study

## Learning checkpoint: current architecture

```text
React dashboard → Fastify API → PostgreSQL
                         ↓
                  Redis (ready)
                         ↓
              BullMQ worker (next milestones)
```

The API already persists campaigns and one `EmailJob` database record per recipient. The next step is to enqueue those records in BullMQ, then create a separate worker that processes them independently of the API request.
