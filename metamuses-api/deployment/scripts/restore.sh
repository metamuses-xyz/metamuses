#!/bin/bash
# ============================================================================
# MetaMuses API - Restore Script
# Restores from a backup created by backup.sh
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
TEMP_DIR="/tmp/metamuses_restore_$$"

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
    error "Restore failed at line $1"
    cleanup_temp
    exit 1
}

trap 'handle_error $LINENO' ERR

# ============================================================================
# Functions
# ============================================================================

usage() {
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Example:"
    echo "  $0 metamuses_backup_20250123_030000.tar.gz"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/metamuses_backup_*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if backup file provided
    if [ $# -eq 0 ]; then
        error "No backup file specified"
        usage
    fi

    BACKUP_FILE="$1"

    # Check if backup file exists
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
        usage
    fi

    # Check if Docker is running
    if ! docker ps &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi

    log "✓ Prerequisites check passed"
}

confirm_restore() {
    warn "This will OVERWRITE current data with backup: $BACKUP_FILE"
    warn "Current data will be backed up before restore."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
}

create_pre_restore_backup() {
    log "Creating pre-restore backup of current state..."

    bash "$APP_DIR/deployment/scripts/backup.sh"

    log "✓ Pre-restore backup created"
}

extract_backup() {
    log "Extracting backup..."

    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"

    tar -xzf "$BACKUP_DIR/$BACKUP_FILE"

    # Find extracted directory
    EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "metamuses_backup_*" | head -n 1)

    if [ -z "$EXTRACTED_DIR" ]; then
        error "Failed to find extracted backup directory"
        exit 1
    fi

    log "✓ Backup extracted to $EXTRACTED_DIR"
}

stop_services() {
    log "Stopping services..."

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml down

    log "✓ Services stopped"
}

restore_redis() {
    log "Restoring Redis data..."

    if [ -f "$EXTRACTED_DIR/redis_dump.rdb" ]; then
        # Start Redis only
        cd "$APP_DIR"
        docker compose -f deployment/docker/docker-compose.production.yml up -d redis

        # Wait for Redis to start
        sleep 5

        # Stop Redis to copy dump file
        docker compose -f deployment/docker/docker-compose.production.yml stop redis

        # Copy dump file
        docker cp "$EXTRACTED_DIR/redis_dump.rdb" metamuses-redis:/data/dump.rdb

        log "✓ Redis data restored"
    else
        warn "Redis backup not found in backup archive"
    fi
}

restore_qdrant() {
    log "Restoring Qdrant data..."

    if [ -d "$EXTRACTED_DIR/qdrant_storage" ]; then
        # Remove current Qdrant data
        sudo rm -rf /mnt/data/qdrant/*

        # Copy Qdrant storage
        sudo cp -r "$EXTRACTED_DIR/qdrant_storage/"* /mnt/data/qdrant/

        # Fix permissions
        sudo chown -R 1000:1000 /mnt/data/qdrant

        log "✓ Qdrant data restored"
    else
        warn "Qdrant backup not found in backup archive"
    fi
}

restore_configuration() {
    log "Restoring configuration files..."

    # Restore .env file
    if [ -f "$EXTRACTED_DIR/env.backup" ]; then
        cp "$EXTRACTED_DIR/env.backup" "$APP_DIR/.env"
        chmod 600 "$APP_DIR/.env"
        log "✓ .env file restored"
    fi

    # Note: Don't restore docker-compose.yml as it might have changed
    # Note: Don't restore Nginx config automatically (requires manual review)

    log "✓ Configuration restored (review Nginx and docker-compose changes manually)"
}

start_services() {
    log "Starting all services..."

    cd "$APP_DIR"
    docker compose -f deployment/docker/docker-compose.production.yml up -d

    log "✓ Services started"
}

health_check() {
    log "Running health check..."

    local attempt=1
    local max_attempts=30

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:8080/health" > /dev/null 2>&1; then
            log "✓ Health check passed"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed after $max_attempts attempts"
            return 1
        fi

        sleep 5
        ((attempt++))
    done
}

cleanup_temp() {
    log "Cleaning up temporary files..."

    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi

    log "✓ Cleanup completed"
}

# ============================================================================
# Main Restore Flow
# ============================================================================

main() {
    log ""
    log "=========================================="
    log "  MetaMuses API Restore"
    log "=========================================="
    log ""

    # Step 1: Check prerequisites
    check_prerequisites "$@"

    # Step 2: Confirm restore
    confirm_restore

    # Step 3: Create pre-restore backup
    create_pre_restore_backup

    # Step 4: Extract backup
    extract_backup

    # Step 5: Stop services
    stop_services

    # Step 6: Restore Redis
    restore_redis

    # Step 7: Restore Qdrant
    restore_qdrant

    # Step 8: Restore configuration
    restore_configuration

    # Step 9: Start services
    start_services

    # Step 10: Health check
    if ! health_check; then
        error "Health check failed after restore!"
        error "Please check logs: docker compose -f deployment/docker/docker-compose.production.yml logs"
    fi

    # Step 11: Cleanup
    cleanup_temp

    log ""
    log "=========================================="
    log "  Restore Completed Successfully!"
    log "=========================================="
    log ""
    log "Services are now running with restored data"
    log ""
    log "Check status with:"
    log "  docker compose -f deployment/docker/docker-compose.production.yml ps"
    log ""
}

# Run main function
main "$@"
