# School SaaS Frontend Web App 🎨

A highly interactive, beautiful, and responsive multi-tenant **School Management System Frontend** built using **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Shadcn UI**.

This repository houses the entire user interface and logic for students, teachers, parents, administrators, and super-admins.

---

## 🚀 Technology Stack

*   **Framework**: Next.js 16 (App Router)
*   **Styling**: Tailwind CSS v4 (Modern CSS-first configuration)
*   **State Management**: Zustand
*   **Data Fetching & Caching**: TanStack React Query (with localStorage synchronization & persistence)
*   **Animations**: Framer Motion & AnimeJS (Subtle micro-animations and smooth transitions)
*   **Security & Auth**: Firebase Authentication
*   **Error Monitoring**: Sentry Integration
*   **Product Analytics**: PostHog Integration
*   **Component Library**: Radix UI Primitives & Lucide Icons

---

## 🛠️ Environment Configuration

Create a local environment file named `.env` in the root of this folder. Below is the configuration required for development and production.

```env
# API URL (Backend ElysiaJS Server)
# Development: http://localhost:4000/api
# Production: https://api.startintern.in/api
NEXT_PUBLIC_API_URL="https://api.startintern.in/api"

# Global Timezone setting for SSR
TZ="Asia/Kolkata"

# Sentry DSN (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-api-key"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"

# Firebase Client Configuration (Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="school-prod.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="school-prod"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="school-prod.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your-vapid-key"
```

> [!IMPORTANT]
> When deploying to production on **`startintern.in`**, ensure that `NEXT_PUBLIC_API_URL` is set to **`https://api.startintern.in/api`**. This points your Next.js application to your live secured backend!

---

## ⚙️ Running Locally

Follow these quick commands to spin up the web application on your local development machine:

### 1. Install Dependencies
Ensure you have [Bun](https://bun.sh/) installed:
```bash
bun install
```

### 2. Run the Development Server
```bash
bun run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Build for Production
Compiles the application and generates optimized static pages:
```bash
bun run build
```

### 4. Run Production Server Locally
```bash
bun run start
```

---

## 💎 Architecture Details

*   **Next.js Proxy & API Handling**: 
    To prevent hardcoded localhost endpoints and prevent CORS failures, all client-side requests are routed dynamically through `NEXT_PUBLIC_API_URL`.
*   **Robust Caching**: 
    TanStack Query (`@tanstack/react-query`) handles query caching, background refetching, and state sync, storing crucial student and teacher metrics on the client-side for blistering speeds.
*   **Timezone Enforcement**: 
    The server and client are synced to the `Asia/Kolkata` time standard to guarantee attendance, timetables, and assignments are reported accurately across all devices.
*   **Security Headers**: 
    Ensured alignment with backend security headers (`helmet`) using secure Cookie practices and authenticated requests (`Credentials: include`).