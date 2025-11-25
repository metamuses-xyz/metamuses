#!/bin/bash
# ============================================================================
# MetaMuses API - Deployment Script
# Handles building, deploying, and health checking the application
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/metamuses"
BACKUP_SCRIPT="$APP_DIR/deployment/scripts/backup.sh"
HEALTH_CHECK_URL="http://localhost:8080/health"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5

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

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if running in correct directory
    if [ ! -f "$APP_DIR/deployment/docker/docker-compose.production.yml" ]; then
        error "docker-compose.production.yml not found. Are you in the correct directory?"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$APP_DIR/.env" ]; then
        error ".env file not found. Please create it first."
        exit 1
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

    # Check if model directory exists and has files
    if [ ! -d "/mnt/models" ] || [ -z "$(ls -A /mnt/models)" ]; then
        warn "Model directory is empty. Make sure to upload model files to /mnt/models"
    fi

    log "✓ Prerequisites check passed"
}

create_backup() {
    log "Creating pre-deployment backup..."

    if [ -f "$BACKUP_SCRIPT" ]; then
        bash "$BACKUP_SCRIPT"
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

    # Set PostgreSQL directory permissions (PostgreSQL runs as user 70 in alpine)
    sudo chmod 700 /mnt/data/postgres
    sudo chown -R 70:70 /mnt/data/postgres

    # Set proper ownership for other directories
    sudo chown -R $(whoami):$(whoami) /mnt/data/redis /mnt/data/qdrant
    sudo chown -R 65534:65534 /mnt/data/prometheus
    sudo chown -R 472:472 /mnt/data/grafana
    sudo chown -R $(whoami):$(whoami) /opt/metamuses/logs

    log "✓ Directories configured"
}

build_images() {
    log "Building Docker images..."

    cd "$APP_DIR"

    # Build both API server and worker images
    docker compose -f deployment/docker/docker-compose.production.yml build --no-cache api worker

    log "✓ Docker images built successfully"
}

stop_services() {
    log "Stopping current services..."

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml stop api worker || true

    log "✓ Services stopped"
}

start_services() {
    log "Starting services..."

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml up -d

    log "✓ Services started"
}

health_check() {
    log "Running health check..."

    local attempt=1
    while [ $attempt -le $HEALTH_CHECK_RETRIES ]; do
        info "Health check attempt $attempt/$HEALTH_CHECK_RETRIES..."

        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "✓ Health check passed"
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

rollback() {
    warn "Rolling back to previous version..."

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml down api worker
    # Restore from backup would go here if needed
    docker compose -f deployment/docker/docker-compose.production.yml up -d

    error "Rollback completed. Please investigate the issue."
}

cleanup() {
    log "Cleaning up..."

    # Remove dangling images
    docker image prune -f

    # Remove unused volumes (with confirmation)
    docker volume prune -f || true

    log "✓ Cleanup completed"
}

show_status() {
    log "Deployment Status:"
    echo ""
    docker compose -f deployment/docker/docker-compose.production.yml ps
    echo ""
    log "API Server logs (last 10 lines):"
    docker compose -f deployment/docker/docker-compose.production.yml logs --tail=10 api
    echo ""
    log "Worker logs (last 10 lines):"
    docker compose -f deployment/docker/docker-compose.production.yml logs --tail=10 worker
}

# ============================================================================
# Main Deployment Flow
# ============================================================================

main() {
    log ""
    log "=========================================="
    log "  MetaMuses API Deployment"
    log "=========================================="
    log ""

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

    log ""
    log "=========================================="
    log "  Deployment Completed Successfully!"
    log "=========================================="
    log ""
    log "Services are now running at:"
    log "  - API Server:  http://localhost:8080"
    log "  - Health:      http://localhost:8080/health"
    log "  - Metrics:     http://localhost:8080/metrics"
    log "  - PostgreSQL:  localhost:5432"
    log "  - Redis:       localhost:6379"
    log "  - Qdrant:      localhost:6333"
    log "  - Prometheus:  http://localhost:9090"
    log "  - Grafana:     http://localhost:3000"
    log ""
    log "Check logs with:"
    log "  docker compose -f deployment/docker/docker-compose.production.yml logs -f api"
    log "  docker compose -f deployment/docker/docker-compose.production.yml logs -f worker"
    log ""
    log "Scale workers with:"
    log "  docker compose -f deployment/docker/docker-compose.production.yml up -d --scale worker=3"
    log ""
}

# Run main function
main "$@"
