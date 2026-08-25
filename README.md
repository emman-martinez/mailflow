# Mailflow

A full-stack email campaign platform built to demonstrate asynchronous job queues, background workers, real-time monitoring, authentication, and production-ready engineering practices.

> Status: actively under development. The queue, worker, scheduling, recovery, real-time event, local SMTP, and automated testing foundations are implemented; production hardening is next.

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
- Socket.IO browser connection with Redis Pub/Sub event bridge
- Worker event publishing for email-job status changes
- Nodemailer delivery through a local Mailpit SMTP server
- Vitest unit, integration, and coverage reporting foundations
- Playwright end-to-end campaign workflow test configuration

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
- BullMQ
- Socket.IO
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

Copy the worker environment file as well:

```powershell
Copy-Item apps\worker\.env.example apps\worker\.env
```

### 4. Start PostgreSQL, Redis, and Mailpit

```powershell
docker compose up -d
docker compose ps
docker compose exec redis redis-cli ping
```

PostgreSQL and Redis should become healthy. The final command should return `PONG`. Mailpit should also be running on its local SMTP and web ports.

Mailpit provides a safe local SMTP server for development:

- SMTP server: `localhost:1025`
- Mailpit inbox: [http://localhost:8025](http://localhost:8025)

Emails sent by the worker through Nodemailer appear in Mailpit and are not delivered to real recipients.

> Redis is the backing store for BullMQ. It contains queue data when campaigns are created and jobs are waiting or being processed.

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
npx prisma studio --config .\prisma.config.ts
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

### 9. Start the worker

Open a third terminal in the project root:

```powershell
npm run dev -w @mailflow/worker
```

Expected startup output:

```text
Mailflow worker is listening to the "email-delivery" queue.
```

Keep this terminal open while creating campaigns. The worker claims waiting BullMQ jobs and updates their PostgreSQL status independently of the API request.

### 10. Verify real-time job events

Open the dashboard at `http://localhost:5173/dashboard` and open the browser developer console. Create a campaign with normal test recipients from the campaign form.

Use these values for a reproducible immediate-delivery test:

```text
Campaign name: Realtime worker test
Email subject: Your Mailflow test is processing
Message: This campaign verifies that Mailflow can process email jobs and report status updates in real time.
Recipients:
realtime-one@example.com
realtime-two@example.com
Schedule: leave empty for immediate processing
```

The worker should publish status events through Redis, the API should forward them through Socket.IO, and the browser console should show events such as:

```text
Email job updated: { status: "ACTIVE", ... }
Email job updated: { status: "COMPLETED", ... }
```

For a retry test, use a recipient containing `+fail@`, such as `test+fail@example.com`. The expected event sequence is:

```text
ACTIVE → RETRYING → RETRYING → FAILED
```

The event channel is `mailflow:job-events`. PostgreSQL remains the source of truth; Redis Pub/Sub transports live notifications and does not replace durable database state.

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

Use Postman (or another API client) to register, log in, save the JWT token as an environment variable, and send it as a Bearer token. The campaign endpoint saves campaign and email-job records in PostgreSQL, then enqueues each email job in BullMQ.

## Useful commands

```powershell
# Type-check the API
npm run typecheck -w @mailflow/api

# Type-check the worker
npm run typecheck -w @mailflow/worker

# Build the frontend
npm run build -w @mailflow/web

# Run API unit tests
npm run test -w @mailflow/api

# Run API integration tests
npm run test:integration -w @mailflow/api

# Run worker tests
npm run test -w @mailflow/worker

# Run frontend tests
npm run test -w @mailflow/web

# Generate Vitest coverage reports
npm run test:coverage -w @mailflow/api
npm run test:coverage -w @mailflow/worker
npm run test:coverage -w @mailflow/web

# Run the browser end-to-end workflow
npm run test:e2e -w @mailflow/web

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

### Testing notes

Vitest runs unit and integration tests under each workspace's `src` directory. Playwright tests are stored separately under `apps/web/e2e` and must be run with the `test:e2e` script. Start the API, worker, frontend, PostgreSQL, and Redis before running the end-to-end campaign workflow.

Coverage reports are generated in each workspace's `coverage` directory. The reports are ignored by Git. Playwright failure artifacts are also ignored through `playwright-report/` and `test-results/`.

## Project structure

```text
mailflow/
├── apps/
│   ├── web/              # React frontend
│   ├── api/              # Fastify API and Prisma schema
│   └── worker/           # Background worker service
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
- [x] BullMQ email queue producer and Redis-backed campaign jobs
- [x] Separate email worker with PostgreSQL job state updates
- [x] Retry and exponential backoff
- [x] Failed-job recovery controls with manual requeue actions
- [x] Live dashboard polling, browser campaign creation, and dashboard retry action
- [x] Scheduled campaigns with delayed BullMQ jobs
- [x] Socket.IO connection and Redis Pub/Sub event bridge
- [x] Live dashboard updates driven by worker events
- [x] Email-provider integration and safe development mail testing with Nodemailer and Mailpit
- [x] Backend and frontend unit/integration test foundation
- [ ] End-to-end browser test verification in the local full stack
- [x] Vitest coverage reporting
- [ ] Structured error logs and Sentry monitoring
- [ ] Docker production setup, GitHub Actions, and deployment
- [ ] Architecture diagrams, screenshots, and portfolio case study

## Overall progress

**Estimated completion: 65%**

`█████████████░░░░░░░ 65%`

> This estimate measures progress against the complete portfolio roadmap, including a production-ready worker, observability, tests, CI/CD, deployment, and the final case study—not only the current MVP.

## Learning checkpoint: current architecture

```text
React dashboard → Fastify API → PostgreSQL
                         ↓
             BullMQ queue → Redis
                         ↓
                 Worker service
```

For live monitoring, the worker publishes job-status events to Redis Pub/Sub. The API subscribes to `mailflow:job-events` and broadcasts those events through Socket.IO to connected React clients. The dashboard invalidates its TanStack Query data immediately when an event arrives and keeps polling as a fallback.
