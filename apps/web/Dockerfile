# -----------------------------------------------------
# STAGE 1: Dependency Installation & Build
# -----------------------------------------------------
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy the package manifest first so dependency installation stays a cached layer.
# This directory is a workspace member: it has no lockfile of its own (the monorepo
# lock sits at the repo root), so the container installs from package.json alone.
COPY package.json ./
RUN bun install

# Copy the rest of the application files
COPY . .

# Declare Build Arguments (passed from GitHub Actions or CLI)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY

ENV NEXT_TELEMETRY_DISABLED=1

# Report which build-time variables actually reached the compiler. Names only:
# these are client-inlined values, but there is no reason to print them.
RUN set -eu; \
    for name in NEXT_PUBLIC_API_URL NEXT_PUBLIC_SENTRY_DSN NEXT_PUBLIC_POSTHOG_KEY \
        NEXT_PUBLIC_POSTHOG_HOST NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
        NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID \
        NEXT_PUBLIC_FIREBASE_VAPID_KEY; do \
        eval "supplied=\${$name:-}"; \
        if [ -n "$supplied" ]; then echo "build-env $name=set"; else echo "build-env $name=absent"; fi; \
    done

# Build the Next.js standalone application. A build argument that was never
# passed arrives as an empty variable, and Next treats an empty value as set,
# which would shadow the .env in the context and bake a blank API URL into the
# client bundle. Drop the empty ones so the supplied value wins when there is
# one and .env is the fallback when there is not.
RUN set -eu; \
    for name in NEXT_PUBLIC_API_URL NEXT_PUBLIC_SENTRY_DSN NEXT_PUBLIC_POSTHOG_KEY \
        NEXT_PUBLIC_POSTHOG_HOST NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
        NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID \
        NEXT_PUBLIC_FIREBASE_VAPID_KEY; do \
        eval "supplied=\${$name:-}"; \
        if [ -z "$supplied" ]; then unset "$name"; fi; \
    done; \
    bun run build

# Assemble the runner payload under /app/output. Next puts node_modules at the
# standalone root and, in a workspace, nests the app beneath its folder name,
# so locate server.js and drop static and public beside it rather than assuming
# either layout. The path is recorded for the runner's start command.
RUN set -eux; \
    STAGE=/app/output; \
    rm -rf "$STAGE"; mkdir -p "$STAGE"; \
    cp -a .next/standalone/. "$STAGE"/; \
    SERVER=$(find "$STAGE" -name server.js -not -path '*/node_modules/*' -print -quit); \
    test -n "$SERVER"; \
    APPDIR=$(dirname "$SERVER"); \
    mkdir -p "$APPDIR/.next"; \
    cp -a .next/static "$APPDIR/.next/static"; \
    cp -a public "$APPDIR/public"; \
    printf '%s\n' "${SERVER#"$STAGE"/}" > /app/entry.txt

# -----------------------------------------------------
# STAGE 2: Hardened Production Runner (No Source Code)
# -----------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy the staged standalone build (does not contain original TS/TSX source code)
COPY --from=builder /app/output ./
COPY --from=builder /app/entry.txt ./entry.txt

EXPOSE 3000

# Next.js standalone builds create a server.js file
CMD ["sh", "-c", "exec node \"$(cat ./entry.txt)\""]
