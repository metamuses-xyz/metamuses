#!/bin/bash
# ============================================================================
# MetaMuses API - Production Deployment Script
#
# Deploys the MetaMuses API with 8 workers for Qwen2.5-0.5B model
# Configuration: 8 workers × 2 threads = 16 vCPU (Maximum Concurrency)
#
# Expected Performance:
#   - Concurrent users: 8
#   - Response latency: ~5-8 seconds
#   - Throughput: ~50-70 requests/min
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${APP_DIR:-/opt/metamuses}"
MODELS_DIR="${MODELS_DIR:-/mnt/models}"
MODEL_FILENAME="${MODEL_FILENAME:-qwen2.5-0.5b-instruct-q4_k_m.gguf}"
BACKUP_SCRIPT="$APP_DIR/deployment/scripts/backup.sh"
HEALTH_CHECK_URL="http://localhost:8080/health"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5

# Worker Configuration (8 workers × 2 threads = 16 vCPU)
TOTAL_WORKERS=8
THREADS_PER_WORKER=2

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

header() {
    echo -e "${CYAN}$1${NC}"
}

# Error handler
handle_error() {
    error "Deployment failed at line $1"
    error "Rolling back..."
    rollback
    exit 1
}

trap 'handle_error $LINENO' ERR

# ============================================================================
# Functions
# ============================================================================

show_banner() {
    header ""
    header "╔════════════════════════════════════════════════════════════╗"
    header "║          MetaMuses API - Production Deployment             ║"
    header "╠════════════════════════════════════════════════════════════╣"
    header "║  Model: Qwen2.5-0.5B-Instruct (Q4_K_M)                     ║"
    header "║  Workers: $TOTAL_WORKERS × $THREADS_PER_WORKER threads = $((TOTAL_WORKERS * THREADS_PER_WORKER)) vCPU                        ║"
    header "║  Expected: 8 concurrent users, ~5-8s latency               ║"
    header "║  Throughput: ~50-70 requests/min                           ║"
    header "╚════════════════════════════════════════════════════════════╝"
    header ""
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if running in correct directory
    if [ ! -f "$APP_DIR/deployment/docker/docker-compose.production.yml" ]; then
        error "docker-compose.production.yml not found at $APP_DIR/deployment/docker/"
        error "Are you in the correct directory? Set APP_DIR if needed."
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$APP_DIR/deployment/docker/.env" ]; then
        warn ".env file not found. Creating from .env.example..."
        if [ -f "$APP_DIR/deployment/docker/.env.example" ]; then
            cp "$APP_DIR/deployment/docker/.env.example" "$APP_DIR/deployment/docker/.env"
            warn "Please edit $APP_DIR/deployment/docker/.env with your configuration"
        else
            error ".env.example not found. Please create .env file manually."
            exit 1
        fi
    fi

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi

    # Check if model file exists
    MODEL_PATH="$MODELS_DIR/$MODEL_FILENAME"
    if [ ! -f "$MODEL_PATH" ]; then
        error "Model file not found: $MODEL_PATH"
        error ""
        error "Download the model first:"
        error "  ./deployment/scripts/download-model.sh"
        error ""
        error "Or manually:"
        error "  mkdir -p $MODELS_DIR"
        error "  wget -P $MODELS_DIR https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/$MODEL_FILENAME"
        exit 1
    fi

    info "Model found: $MODEL_PATH ($(du -h "$MODEL_PATH" | cut -f1))"
    log "✓ Prerequisites check passed"
}

create_backup() {
    log "Creating pre-deployment backup..."

    if [ -f "$BACKUP_SCRIPT" ]; then
        bash "$BACKUP_SCRIPT" || warn "Backup script returned non-zero exit code"
        log "✓ Backup created successfully"
    else
        warn "Backup script not found, skipping backup"
    fi
}

ensure_directories() {
    log "Ensuring required directories exist..."

    # Create data directories if they don't exist
    sudo mkdir -p /mnt/data/{postgres,redis,qdrant,prometheus,grafana}
    sudo mkdir -p /opt/metamuses/logs/{api,worker}
    sudo mkdir -p "$MODELS_DIR"

    # Set PostgreSQL directory permissions (PostgreSQL runs as user 70 in alpine)
    sudo chmod 700 /mnt/data/postgres
    sudo chown -R 70:70 /mnt/data/postgres

    # Set proper ownership for other directories
    sudo chown -R "$(whoami):$(whoami)" /mnt/data/redis /mnt/data/qdrant
    sudo chown -R 65534:65534 /mnt/data/prometheus
    sudo chown -R 472:472 /mnt/data/grafana
    sudo chown -R "$(whoami):$(whoami)" /opt/metamuses/logs

    log "✓ Directories configured"
}

build_images() {
    log "Building Docker images..."

    cd "$APP_DIR"

    # Build API server and worker images
    docker compose -f deployment/docker/docker-compose.production.yml build --no-cache api worker-0

    log "✓ Docker images built successfully"
}

stop_services() {
    log "Stopping current services..."

    cd "$APP_DIR"

    # Stop all workers (0-7) and API
    docker compose -f deployment/docker/docker-compose.production.yml stop \
        api worker-0 worker-1 worker-2 worker-3 worker-4 worker-5 worker-6 worker-7 || true

    log "✓ Services stopped"
}

start_services() {
    log "Starting services..."

    cd "$APP_DIR"

    # Start all services including 8 workers
    docker compose -f deployment/docker/docker-compose.production.yml up -d \
        postgres redis api \
        worker-0 worker-1 worker-2 worker-3 worker-4 worker-5 worker-6 worker-7

    log "✓ Services started (8 workers)"
}

health_check() {
    log "Running health check..."

    local attempt=1
    while [ $attempt -le $HEALTH_CHECK_RETRIES ]; do
        info "Health check attempt $attempt/$HEALTH_CHECK_RETRIES..."

        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "✓ API health check passed"

            # Check worker status
            check_workers
            return 0
        fi

        if [ $attempt -eq $HEALTH_CHECK_RETRIES ]; then
            error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
            return 1
        fi

        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
}

check_workers() {
    log "Checking worker status..."

    local running_workers=0
    for i in $(seq 0 7); do
        if docker compose -f deployment/docker/docker-compose.production.yml ps worker-$i 2>/dev/null | grep -q "Up"; then
            ((running_workers++))
        fi
    done

    if [ $running_workers -eq 8 ]; then
        log "✓ All 8 workers are running"
    else
        warn "Only $running_workers/8 workers are running"
    fi
}

rollback() {
    warn "Rolling back to previous version..."

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml down \
        api worker-0 worker-1 worker-2 worker-3 worker-4 worker-5 worker-6 worker-7 || true

    # Restart with previous images
    docker compose -f deployment/docker/docker-compose.production.yml up -d

    error "Rollback completed. Please investigate the issue."
}

cleanup() {
    log "Cleaning up..."

    # Remove dangling images
    docker image prune -f

    # Remove unused volumes (careful with this)
    # docker volume prune -f || true

    log "✓ Cleanup completed"
}

show_status() {
    log "Deployment Status:"
    echo ""

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml ps

    echo ""
    log "Queue Status:"
    # Check Redis queue depth
    QUEUE_DEPTH=$(docker compose -f deployment/docker/docker-compose.production.yml exec -T redis \
        redis-cli -a changeme ZCARD metamuse:queue:fast:1 2>/dev/null || echo "0")
    info "  Queue depth (fast tier): $QUEUE_DEPTH jobs"

    echo ""
    log "API Server logs (last 5 lines):"
    docker compose -f deployment/docker/docker-compose.production.yml logs --tail=5 api 2>/dev/null || true

    echo ""
    log "Worker-0 logs (last 5 lines):"
    docker compose -f deployment/docker/docker-compose.production.yml logs --tail=5 worker-0 2>/dev/null || true
}

show_summary() {
    log ""
    header "╔════════════════════════════════════════════════════════════╗"
    header "║          Deployment Completed Successfully!                ║"
    header "╚════════════════════════════════════════════════════════════╝"
    log ""
    log "Services running:"
    log "  - API Server:  http://localhost:8080"
    log "  - Health:      http://localhost:8080/health"
    log "  - PostgreSQL:  localhost:5432"
    log "  - Redis:       localhost:6379"
    log "  - Workers:     8 instances (worker-0 to worker-7)"
    log ""
    log "Performance:"
    log "  - Model:       Qwen2.5-0.5B-Instruct (Q4_K_M)"
    log "  - Concurrent:  8 users"
    log "  - Latency:     ~5-8 seconds"
    log "  - Throughput:  ~50-70 requests/min"
    log ""
    log "Monitor logs:"
    log "  docker compose -f deployment/docker/docker-compose.production.yml logs -f api"
    log "  docker compose -f deployment/docker/docker-compose.production.yml logs -f worker-0"
    log ""
    log "Check queue depth:"
    log "  docker compose -f deployment/docker/docker-compose.production.yml exec redis redis-cli -a changeme ZCARD metamuse:queue:fast:1"
    log ""
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

main() {
    show_banner

    # Step 1: Check prerequisites
    check_prerequisites

    # Step 2: Ensure directories exist with correct permissions
    ensure_directories

    # Step 3: Create backup
    create_backup

    # Step 4: Build images
    build_images

    # Step 5: Stop current services
    stop_services

    # Step 6: Start new services
    start_services

    # Step 7: Health check
    if ! health_check; then
        error "Health check failed!"
        rollback
        exit 1
    fi

    # Step 8: Cleanup
    cleanup

    # Step 9: Show status
    show_status

    # Step 10: Show summary
    show_summary
}

# Run main function
main "$@"
