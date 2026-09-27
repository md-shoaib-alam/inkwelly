# Production Server Deployment Guide (Secure Docker Setup)

This guide explains how to build, publish, and deploy the entire application stack (Next.js frontend & Bun backend API) to a production VPS securely without exposing or leaking your source code.

---

## Architecture Overview

```mermaid
graph TD
    subgraph Build Machine (Local PC / CI)
        FS[Frontend Src] -->|next build| FStand[Standalone Build]
        FStand -->|Docker| FImg[ghcr.io/.../school-web]
        BS[Backend Src] -->|bun compile| BMin[Minified Binary]
        BMin -->|Docker| BImg[ghcr.io/.../school-backend]
    end

    subgraph Production VPS
        FImg -->|Pull| FContainer[Frontend Container]
        BImg -->|Pull| BContainer[Backend Container]
        EnvFile[.env Files] -->|Inject| FContainer & BContainer
    end
```

By compiling/packaging both applications into hardened production containers:
*   Your raw TypeScript code (`.ts`, `.tsx`, `.css`) is **completely excluded** from the VPS.
*   The VPS only runs pre-compiled standalone JS files and binary code, protecting your IP.
*   Deployments and rollbacks are instant and safe.

---

## Phase 1: Build and Push (Local PC or CI/CD)

Log in to GitHub Container Registry (GHCR) on your build machine:
```bash
echo "YOUR_PERSONAL_ACCESS_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 1. Build & Push Backend
Navigate to the `server/` directory:
```bash
cd server
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/school-backend:latest .
docker push ghcr.io/YOUR_GITHUB_USERNAME/school-backend:latest
```

### 2. Build & Push Frontend
Navigate to the `school-web/` directory:
```bash
cd ../school-web
docker build -t ghcr.io/YOUR_GITHUB_USERNAME/school-web:latest .
docker push ghcr.io/YOUR_GITHUB_USERNAME/school-web:latest
```

---

## Phase 2: VPS Production Setup

Run these commands inside your production VPS.

### 1. Create Application Directories
Create separate directories to store production configuration and secret keys:

```bash
mkdir -p /app/school-server
cd /app/school-server
```

### 2. Create the Backend Environment File (`.env.backend`)
Create the `.env.backend` file on the VPS disk:

```bash
nano .env.backend
```
*(Paste your backend environment variables from your local server/.env file, setting `LOG_LEVEL=silent` and `NODE_ENV=production`)*

### 3. Create the Frontend Environment File (`.env.frontend`)
Create the `.env.frontend` file on the VPS disk:

```bash
nano .env.frontend
```
*(Paste your client-side variables, e.g., `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`)*

### 4. Create the Production Docker Compose File
Create a unified `docker-compose.yml` to orchestrate both the frontend and backend:

```bash
nano docker-compose.yml
```

Paste the following configuration:

```yaml
version: '3.8'

services:
  # ─── Backend API ───────────────────────────────────────
  backend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/school-backend:latest
    container_name: school-saas-api
    restart: always
    ports:
      - "4000:4000"
    env_file:
      - .env.backend
    volumes:
      # If you need to mount the firebase service account json file:
      - ./firebase-service-account.json:/app/firebase-service-account.json:ro

  # ─── Frontend Next.js Web App ──────────────────────────
  frontend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/school-web:latest
    container_name: school-saas-web
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.frontend
    depends_on:
      - backend
```

---

## Phase 3: Start and Update the Application

### 1. Authenticate the VPS to GHCR
Log in to your registry from the VPS:

```bash
echo "YOUR_PERSONAL_ACCESS_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2. Pull & Start both Services
Pull the latest images from GHCR and start the containers in background mode:

```bash
# Pull the latest built images
docker compose pull

# Start the stack
docker compose up -d
```

### 3. Verify Container Status
To check if the containers are running and healthy:

```bash
docker ps
docker compose logs -f
```

---

## Updating the App (Subsequent Deployments)
When you write new code, simply run this workflow:

1. **Local/CI**: Build and push the new images:
   ```bash
   # Build & push backend
   docker build -t ghcr.io/YOUR_GITHUB_USERNAME/school-backend:latest ./server
   docker push ghcr.io/YOUR_GITHUB_USERNAME/school-backend:latest

   # Build & push frontend
   docker build -t ghcr.io/YOUR_GITHUB_USERNAME/school-web:latest ./school-web
   docker push ghcr.io/YOUR_GITHUB_USERNAME/school-web:latest
   ```

2. **VPS**: Pull the new version and reload:
   ```bash
   cd /app/school-server
   docker compose pull
   docker compose up -d
   ```
   *Docker Compose will automatically recreate the containers with new image versions with zero-downtime.*
