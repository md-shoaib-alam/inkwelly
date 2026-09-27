# Use official Bun runtime as parent image
FROM oven/bun:1 as builder
WORKDIR /usr/src/app

# Copy package specs for caching
COPY package.json bun.lock ./
# Install ALL dependencies needed for building
RUN bun install --frozen-lockfile

# Copy the full source code only into the builder stage
COPY . .

# Compile to a standalone static binary
# --compile bundles runtime, dependencies and code into a single binary
# --minify obfuscates it further
RUN bun build ./src/index.ts --compile --minify --target bun --outfile app-binary

# -----------------------------------------------------
# FINAL STAGE: Hardened Distroless Container
# Eliminates OS shells/tools and reduces CVE surface area to almost zero.
# -----------------------------------------------------
FROM gcr.io/distroless/cc-debian12:latest AS release

WORKDIR /app

# Copy ONLY the compiled binary and static assets needed from builder
COPY --from=builder /usr/src/app/app-binary ./app-binary

# Expose internal port
EXPOSE 4000

# Set production environment guards
ENV NODE_ENV=production
ENV DISABLE_PRETTY_LOG=true

# Run the standalone binary directly
# No shell needed, executes directly in the minimal environment
ENTRYPOINT ["./app-binary"]
