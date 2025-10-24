#!/bin/bash
# ============================================================================
# MetaMuses API - Backup Script
# Creates backups of Redis, Qdrant, and configuration files
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/metamuses"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="metamuses_backup_$DATE"
RETENTION_DAYS=7

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

# Error handler
handle_error() {
    error "Backup failed at line $1"
    cleanup_failed_backup
    exit 1
}

trap 'handle_error $LINENO' ERR

# ============================================================================
# Functions
# ============================================================================

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is running
    if ! docker ps &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi

    # Check if containers are running
    if ! docker ps | grep -q "metamuses-redis"; then
        warn "Redis container is not running"
    fi

    if ! docker ps | grep -q "metamuses-qdrant"; then
        warn "Qdrant container is not running"
    fi

    log "✓ Prerequisites check passed"
}

create_backup_directory() {
    log "Creating backup directory..."

    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

    log "✓ Backup directory created: $BACKUP_DIR/$BACKUP_NAME"
}

backup_redis() {
    log "Backing up Redis data..."

    if docker ps | grep -q "metamuses-redis"; then
        # Trigger Redis SAVE command
        docker exec metamuses-redis redis-cli SAVE

        # Copy dump.rdb file
        docker cp metamuses-redis:/data/dump.rdb "$BACKUP_DIR/$BACKUP_NAME/redis_dump.rdb"

        log "✓ Redis backup completed"
    else
        warn "Redis container not running, skipping Redis backup"
    fi
}

backup_qdrant() {
    log "Backing up Qdrant data..."

    if docker ps | grep -q "metamuses-qdrant"; then
        # Copy Qdrant storage directory
        docker cp metamuses-qdrant:/qdrant/storage "$BACKUP_DIR/$BACKUP_NAME/qdrant_storage"

        log "✓ Qdrant backup completed"
    else
        warn "Qdrant container not running, skipping Qdrant backup"
    fi
}

backup_configuration() {
    log "Backing up configuration files..."

    # Backup .env file (without exposing secrets in logs)
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" "$BACKUP_DIR/$BACKUP_NAME/env.backup"
    fi

    # Backup docker-compose file
    if [ -f "$APP_DIR/deployment/docker/docker-compose.production.yml" ]; then
        cp "$APP_DIR/deployment/docker/docker-compose.production.yml" "$BACKUP_DIR/$BACKUP_NAME/"
    fi

    # Backup Nginx config
    if [ -f "/etc/nginx/sites-available/api.metamuses.xyz" ]; then
        sudo cp "/etc/nginx/sites-available/api.metamuses.xyz" "$BACKUP_DIR/$BACKUP_NAME/" || true
    fi

    # Backup monitoring configs
    if [ -d "$APP_DIR/deployment/monitoring" ]; then
        cp -r "$APP_DIR/deployment/monitoring" "$BACKUP_DIR/$BACKUP_NAME/"
    fi

    log "✓ Configuration backup completed"
}

compress_backup() {
    log "Compressing backup..."

    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"

    # Remove uncompressed directory
    rm -rf "$BACKUP_NAME"

    # Get backup size
    local backup_size=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)

    log "✓ Backup compressed: $BACKUP_NAME.tar.gz ($backup_size)"
}

cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

    # Find and delete backups older than retention period
    find "$BACKUP_DIR" -name "metamuses_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

    local remaining=$(find "$BACKUP_DIR" -name "metamuses_backup_*.tar.gz" -type f | wc -l)

    log "✓ Old backups cleaned. Remaining backups: $remaining"
}

cleanup_failed_backup() {
    warn "Cleaning up failed backup..."

    if [ -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
        rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    fi

    if [ -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
        rm -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    fi
}

list_backups() {
    log "Available backups:"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/metamuses_backup_*.tar.gz 2>/dev/null || echo "No backups found"
    else
        echo "Backup directory does not exist"
    fi

    echo ""
}

# ============================================================================
# Main Backup Flow
# ============================================================================

main() {
    log ""
    log "=========================================="
    log "  MetaMuses API Backup"
    log "=========================================="
    log ""

    # Step 1: Check prerequisites
    check_prerequisites

    # Step 2: Create backup directory
    create_backup_directory

    # Step 3: Backup Redis
    backup_redis

    # Step 4: Backup Qdrant
    backup_qdrant

    # Step 5: Backup configuration
    backup_configuration

    # Step 6: Compress backup
    compress_backup

    # Step 7: Cleanup old backups
    cleanup_old_backups

    # Step 8: List available backups
    list_backups

    log ""
    log "=========================================="
    log "  Backup Completed Successfully!"
    log "=========================================="
    log ""
    log "Backup location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    log ""
    log "To restore from this backup:"
    log "  bash deployment/scripts/restore.sh $BACKUP_NAME.tar.gz"
    log ""
}

# Run main function
main "$@"
