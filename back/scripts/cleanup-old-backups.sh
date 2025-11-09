#!/bin/bash
# Script for cleaning up old backups (>30 days)
# This script deletes backup files and database records

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lumon}"
DAYS_TO_KEEP="${DAYS_TO_KEEP:-30}"

# Database connection
PGHOST="${PGHOST:-supabase-db}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-lumon}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-lumon_dev_password}"

export PGPASSWORD

# Log file
LOG_FILE="/var/log/lumon/cron-cleanup.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting cleanup of old backups (older than $DAYS_TO_KEEP days)..."

# Find old backup files
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$DAYS_TO_KEEP 2>/dev/null || echo "")

if [ -z "$OLD_BACKUPS" ]; then
    log "No old backups found"
else
    COUNT=0
    while IFS= read -r backup_file; do
        if [ -n "$backup_file" ]; then
            log "Deleting old backup: $backup_file"
            rm -f "$backup_file"
            COUNT=$((COUNT + 1))
        fi
    done <<< "$OLD_BACKUPS"
    log "Deleted $COUNT old backup files"
fi

# Delete old backup records from database
log "Cleaning up old backup records from database..."

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "
    DELETE FROM backups
    WHERE created_at < NOW() - INTERVAL '$DAYS_TO_KEEP days'
    RETURNING id, filename;
" | while read -r backup_id filename; do
    if [ -n "$backup_id" ]; then
        log "Deleted backup record: $filename (id: $backup_id)"
    fi
done

log "Cleanup completed!"

