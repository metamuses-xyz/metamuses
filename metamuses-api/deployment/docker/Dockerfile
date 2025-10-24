# ============================================================================
# MetaMuses API - Production Dockerfile
# Multi-stage build for optimized image size and security
# ============================================================================

# ============================================================================
# Stage 1: Build Stage
# ============================================================================
FROM rust:1.75-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    build-essential \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Cargo files first (for dependency caching)
COPY Cargo.toml Cargo.lock ./

# Create dummy src to cache dependencies
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src ./src

# Build release binary with optimizations
RUN cargo build --release --bin metamuse-server && \
    strip target/release/metamuse-server

# ============================================================================
# Stage 2: Runtime Stage
# ============================================================================
FROM debian:bookworm-slim

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

# Copy binary from builder
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
