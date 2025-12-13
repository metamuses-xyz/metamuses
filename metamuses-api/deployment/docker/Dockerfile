# ============================================================================
# MetaMuses API - Production Dockerfile
# Multi-stage build for optimized image size and security
# Supports both x86_64 and ARM64 (aarch64) architectures
# ============================================================================

# ============================================================================
# Stage 1: Build Stage
# Using Rust nightly for edition2024 support (required by alith dependency)
# Multi-arch support (x86_64 + ARM64)
# ============================================================================
FROM rustlang/rust:nightly-bookworm-slim AS builder

# Install build dependencies for llama.cpp and other native libraries
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    build-essential \
    protobuf-compiler \
    libclang-dev \
    clang \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy all source code
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY .sqlx ./.sqlx
COPY migrations ./migrations

# Build both release binaries with optimizations
# Using SQLX_OFFLINE=true to skip compile-time database checks
ENV SQLX_OFFLINE=true

# Set optimal build flags for the target architecture
# ARM64 will use NEON/SVE, x86_64 will use AVX2
# Using --verbose to debug build issues
RUN echo "=== Starting cargo build ===" && \
    cargo build --release --bin metamuse-server --bin metamuse-worker --verbose && \
    echo "=== Build completed ===" && \
    echo "Binary sizes before strip:" && \
    ls -lh target/release/metamuse-server target/release/metamuse-worker && \
    echo "=== Stripping binaries ===" && \
    strip target/release/metamuse-server && \
    strip target/release/metamuse-worker && \
    echo "Binary sizes after strip:" && \
    ls -lh target/release/metamuse-server target/release/metamuse-worker

# ============================================================================
# Stage 2: Runtime Stage (Server)
# Using debian:bookworm-slim for GLIBC compatibility
# ============================================================================
FROM debian:bookworm-slim AS server

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash metamuse

# Create directories
RUN mkdir -p /app /models /data /app/logs && \
    chown -R metamuse:metamuse /app /models /data

# Copy server binary and migrations from builder
COPY --from=builder --chown=metamuse:metamuse /app/target/release/metamuse-server /app/metamuse-server
COPY --from=builder --chown=metamuse:metamuse /app/migrations /app/migrations

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
# Optimized for AI inference with llama.cpp
# ============================================================================
FROM debian:bookworm-slim AS worker

# Install runtime dependencies including OpenMP for parallel inference
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash metamuse

# Create directories
RUN mkdir -p /app /models /data /app/logs && \
    chown -R metamuse:metamuse /app /models /data

# Copy worker binary and migrations from builder
COPY --from=builder --chown=metamuse:metamuse /app/target/release/metamuse-worker /app/metamuse-worker
COPY --from=builder --chown=metamuse:metamuse /app/migrations /app/migrations

# Switch to non-root user
USER metamuse
WORKDIR /app

# Set environment variables for worker
# These can be overridden by docker-compose
ENV RUST_LOG=info \
    RUST_BACKTRACE=1 \
    WORKER_ID=0 \
    TOTAL_WORKERS=1 \
    THREADS_PER_WORKER=4 \
    BATCH_SIZE=512 \
    CONTEXT_SIZE=2048

# Run the worker
CMD ["/app/metamuse-worker"]
