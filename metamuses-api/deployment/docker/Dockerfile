# ============================================================================
# MetaMuses API - Production Dockerfile
# Multi-stage build for optimized image size and security
# Builds both server and worker binaries
# ============================================================================

# ============================================================================
# Stage 1: Build Stage
# Using nightly for edition2024 support (required by alith dependency)
# ============================================================================
FROM rustlang/rust:nightly-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    build-essential \
    protobuf-compiler \
    libclang-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Cargo files first (for dependency caching)
COPY Cargo.toml Cargo.lock ./

# Create dummy src to cache dependencies
RUN mkdir -p src/bin && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > src/lib.rs && \
    echo "fn main() {}" > src/bin/server.rs && \
    echo "fn main() {}" > src/bin/worker.rs && \
    cargo build --release 2>/dev/null || true && \
    rm -rf src

# Copy actual source code
COPY src ./src
COPY migrations ./migrations
COPY benches ./benches

# Build both release binaries with optimizations
# Using SQLX_OFFLINE=true to skip compile-time database checks
ENV SQLX_OFFLINE=true
RUN cargo build --release --bin metamuse-server --bin metamuse-worker && \
    strip target/release/metamuse-server && \
    strip target/release/metamuse-worker

# ============================================================================
# Stage 2: Runtime Stage (Server)
# Using debian:sid-slim for GLIBC 2.39 compatibility with rust nightly
# ============================================================================
FROM debian:sid-slim AS server

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash metamuse

# Create directories
RUN mkdir -p /app /models /data /app/logs && \
    chown -R metamuse:metamuse /app /models /data

# Copy server binary from builder
COPY --from=builder --chown=metamuse:metamuse /app/target/release/metamuse-server /app/metamuse-server

# Switch to non-root user
USER metamuse
WORKDIR /app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV RUST_LOG=info \
    RUST_BACKTRACE=1

# Run the application
CMD ["/app/metamuse-server"]

# ============================================================================
# Stage 3: Runtime Stage (Worker)
# Using debian:sid-slim for GLIBC 2.39 compatibility with rust nightly
# ============================================================================
FROM debian:sid-slim AS worker

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash metamuse

# Create directories
RUN mkdir -p /app /models /data /app/logs && \
    chown -R metamuse:metamuse /app /models /data

# Copy worker binary from builder
COPY --from=builder --chown=metamuse:metamuse /app/target/release/metamuse-worker /app/metamuse-worker

# Switch to non-root user
USER metamuse
WORKDIR /app

# Set environment variables
ENV RUST_LOG=info \
    RUST_BACKTRACE=1

# Run the worker
CMD ["/app/metamuse-worker"]
