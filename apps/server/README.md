# School SaaS Backend API 🚀

An advanced, secure, and production-grade Multi-Tenant School Management System API built using **ElysiaJS**, **Bun**, and **Drizzle ORM**.

This document outlines the **Production Readiness Audit**, detail-oriented action plans, security recommendations, and setup instructions.

---

## 📋 Production Readiness Audit & Checklist

Below is a detailed audit of the current codebase. Items marked with ⚠️ **must be resolved before deploying to production**.

### 1. Database & Infrastructure Security ⚠️
*   **SSL for PostgreSQL Connection**:
    *   **Current State**: `.env` and `docker-compose.yml` contain `sslmode=disable`.
    *   **Production Requirement**: Production databases (RDS, Neon, etc.) must use encrypted connections. Use `sslmode=require` or specify SSL certificates.
    *   **Hardcoded Passwords**: The database password `strongpassword123` is hardcoded in `docker-compose.yml`. Use environment variable interpolation (`${DB_PASSWORD}`) instead.
*   **Redis Security**:
    *   **Current State**: In `docker-compose.yml`, Redis is run without a password and with a command `--maxmemory-policy noeviction`.
    *   **Production Requirement**: Always set a password for Redis (`--requirepass "${REDIS_PASSWORD}"`). Ensure a clear memory eviction policy is set (e.g., `volatile-lru` or `allkeys-lru`) and set a `maxmemory` limit so Redis does not consume all available host memory and crash the server.

### 2. API Security & Rate Limiting ⚠️
*   **CORS Configuration**:
    *   **Current State** (`src/index.ts:90`): `origin: true` (which mirrors the request origin, allowing any website to make API requests).
    *   **Production Requirement**: Restrict `origin` to a strictly defined whitelist of domains (e.g., `['https://app.yourdomain.com', 'https://admin.yourdomain.com']`).
*   **Rate Limiting**:
    *   **Current State** (`src/index.ts:98`): `max: 100000` per minute. This is exceptionally high and defeats the purpose of rate-limiting, exposing the API to DDoS attacks.
    *   **Production Requirement**: Reduce `max` to a reasonable limit, such as `100` or `200` requests per minute for general routes, and lower limits (e.g. `5` per minute) for authentication/sensitive routes.
*   **JWT Secret Security**:
    *   **Current State**: `.env` contains a development JWT secret.
    *   **Production Requirement**: Rotate this to a cryptographically secure 64-byte random string generated via `openssl rand -base64 48`.

### 3. Third-Party Integrations & Credentials ⚠️
*   **Firebase Service Account**:
    *   **Current State**: The repo contains `firebase-service-account.json` with testing credentials.
    *   **Production Requirement**: Create a production service account in the Firebase Console, secure it, and load it via a safe deployment volume mount or CI secrets. Do not commit actual production credentials to git.
*   **Razorpay, Cloudflare R2, PostHog, Sentry Keys**:
    *   **Current State**: Current `.env` file contains test keys (e.g., `rzp_test_...`).
    *   **Production Requirement**: Retrieve live keys for R2, Razorpay, Sentry, and PostHog, and populate them using environment variable injection during deployment.

---

## 🛠️ Required Code Modifications (Where to Change)

Here is a step-by-step breakdown of the exact files and lines of code you need to update to secure the system for production.

### 1. `docker-compose.yml`
Update DB connection details, Redis memory policies, and inject credentials dynamically.

```yaml
# FILE: server/docker-compose.yml

services:
  postgres:
    image: postgres:16-alpine
    container_name: school-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD} # 👈 Dynamic variable, do not hardcode!
      POSTGRES_DB: appdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: school-cache
    restart: always
    # 👈 Added password protection & memory limits for production safety
    command: redis-server --requirepass "${REDIS_PASSWORD}" --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    image: school-backend:secure
    container_name: school-saas-api
    restart: always
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
      - DISABLE_PRETTY_LOG=true
      - TZ=Asia/Kolkata
      # 👈 SSL enabled connection
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/appdb?sslmode=require
      - DIRECT_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/appdb?sslmode=require
      - JWT_SECRET=${JWT_SECRET}
      - PORT=4000
      - CORS_ORIGIN=${CORS_ORIGIN}
      # 👈 Secured Redis URL
      - REDIS_URL=redis://default:${REDIS_PASSWORD}@redis:6379
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
      - R2_BUCKET_NAME=${R2_BUCKET_NAME}
      - R2_ENDPOINT=${R2_ENDPOINT}
      - R2_PUBLIC_URL=${R2_PUBLIC_URL}
      - POSTHOG_API_KEY=${POSTHOG_API_KEY}
      - POSTHOG_HOST=${POSTHOG_HOST}
```

### 2. `src/index.ts`
Limit CORS requests and secure global rate-limiting.

```typescript
// FILE: server/src/index.ts

// 1. Update CORS Configuration (Line 89-94)
.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? ['https://your-production-app.com', 'https://your-admin-portal.com'] // 👈 Production domains
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
}))

// 2. Adjust Rate Limiting Threshold (Line 96-101)
.use(rateLimit({
  duration: 60000, // 1 minute
  max: env.NODE_ENV === 'production' ? 120 : 100000, // 👈 Safe production limit (120 reqs/min)
  generator: (req, server) => server?.requestIP(req)?.address || 'anonymous',
}))
```

---

## ⚙️ How to Deploy the Backend

### Environment Variables Template (`.env.production`)
Create a secure `.env.production` file on your server. Do not commit this file to GitHub!

```env
# Server
PORT=4000
NODE_ENV=production
TZ="Asia/Kolkata"

# Database
DB_PASSWORD="your-super-secure-generated-db-password"
DATABASE_URL="postgresql://postgres:your-super-secure-generated-db-password@your-prod-db-host:5432/appdb?sslmode=require"

# Redis
REDIS_PASSWORD="your-super-secure-redis-password"
REDIS_URL="redis://default:your-super-secure-redis-password@your-prod-redis-host:6379"

# Security
JWT_SECRET="generate-a-secure-64-character-string"
CORS_ORIGIN="https://app.yourdomain.com"

# Analytics & Monitoring
POSTHOG_API_KEY="phc_your_live_key_here"
POSTHOG_HOST="https://us.i.posthog.com"
SENTRY_DSN="https://your-live-sentry-dsn"

# Cloudflare R2 (Storage)
R2_ACCESS_KEY_ID="your-live-access-key-id"
R2_SECRET_ACCESS_KEY="your-live-secret-access-key"
R2_BUCKET_NAME="production-school-logos"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://assets.yourdomain.com"

# Razorpay (Live Payments)
RAZORPAY_KEY_ID="rzp_live_your_live_key_id"
RAZORPAY_KEY_SECRET="your-live-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-live-webhook-secret"

# Firebase Admin Credentials
FIREBASE_PROJECT_ID="your-production-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-production-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Running Commands in Production

#### 1. Start Services with Docker Compose
To build and spin up the production container stack in detached mode:
```bash
docker compose --env-file .env.production up -d --build
```

#### 2. Run Database Migrations
Always run Drizzle migrations before launching updates:
```bash
# Generate SQL migrations based on typescript schemas
bun run db:generate

# Apply migrations to production database safely
bun run db:migrate
```

#### 3. View Service Logs
```bash
docker compose logs -f backend
```

---

## ⚡ Local Development Commands
If you are running the service locally for development or testing:

1. Install dependencies:
   ```bash
   bun install
   ```
2. Start local DB & Redis:
   ```bash
   docker compose up -d postgres redis
   ```
3. Run development server (with hot reload):
   ```bash
   bun run dev
   ```
4. Access API Docs / Swagger:
   *   URL: `http://localhost:4000/swagger`
