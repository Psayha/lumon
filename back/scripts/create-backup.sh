#!/bin/bash
# Script for creating PostgreSQL backups
# Usage: ./create-backup.sh [backup-name]

set -e

BACKUP_DIR="/var/backups/lumon"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup_${TIMESTAMP}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Get PostgreSQL connection details from environment or use defaults
PGHOST="${PGHOST:-supabase-db}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-lumon}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-lumon_dev_password}"

# Export password for pg_dump
export PGPASSWORD

# Create backup using pg_dump
echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -F c -f "$BACKUP_FILE"

# Get file size
FILE_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")

echo "Backup created successfully: $BACKUP_FILE"
echo "Size: $FILE_SIZE bytes"

# Output JSON for n8n workflow
echo "{\"filename\": \"${BACKUP_NAME}.sql\", \"file_path\": \"${BACKUP_FILE}\", \"file_size\": ${FILE_SIZE}, \"timestamp\": \"$(date -Iseconds)\"}"

