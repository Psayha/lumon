#!/bin/bash
# Script for restoring PostgreSQL backup
# Usage: ./restore-backup.sh <backup-file>

set -e

if [ -z "$1" ]; then
    echo "Error: Backup file path is required"
    echo "Usage: $0 <backup-file>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Get PostgreSQL connection details from environment or use defaults
PGHOST="${PGHOST:-supabase-db}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-lumon}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-lumon_dev_password}"

# Export password for pg_restore
export PGPASSWORD

echo "Restoring backup: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database!"

# Restore backup using pg_restore
pg_restore -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --clean --if-exists "$BACKUP_FILE"

echo "Backup restored successfully"

