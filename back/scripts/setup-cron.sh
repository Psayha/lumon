#!/bin/bash
# Setup cron jobs for backups and health checks
# Usage: ./setup-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Paths
BACKUP_SCRIPT="$SCRIPT_DIR/cron-backup.sh"
HEALTH_CHECK_SCRIPT="$SCRIPT_DIR/cron-health-check.sh"
CLEANUP_SCRIPT="$SCRIPT_DIR/cleanup-old-backups.sh"

# Make scripts executable
chmod +x "$BACKUP_SCRIPT"
chmod +x "$HEALTH_CHECK_SCRIPT"
chmod +x "$CLEANUP_SCRIPT"

# Create cron entries
CRON_BACKUP="0 2 * * * $BACKUP_SCRIPT >> /var/log/lumon/cron-backup.log 2>&1"
CRON_HEALTH_CHECK="*/10 * * * * $HEALTH_CHECK_SCRIPT >> /var/log/lumon/cron-health-check.log 2>&1"
CRON_CLEANUP="0 3 * * * $CLEANUP_SCRIPT >> /var/log/lumon/cron-cleanup.log 2>&1"

# Check if cron entries already exist
CRONTAB=$(crontab -l 2>/dev/null || echo "")

if echo "$CRONTAB" | grep -q "$BACKUP_SCRIPT"; then
    echo "Backup cron job already exists"
else
    (crontab -l 2>/dev/null; echo "$CRON_BACKUP") | crontab -
    echo "Added backup cron job (daily at 2:00 AM)"
fi

if echo "$CRONTAB" | grep -q "$HEALTH_CHECK_SCRIPT"; then
    echo "Health check cron job already exists"
else
    (crontab -l 2>/dev/null; echo "$CRON_HEALTH_CHECK") | crontab -
    echo "Added health check cron job (every 10 minutes)"
fi

if echo "$CRONTAB" | grep -q "$CLEANUP_SCRIPT"; then
    echo "Cleanup cron job already exists"
else
    (crontab -l 2>/dev/null; echo "$CRON_CLEANUP") | crontab -
    echo "Added cleanup cron job (daily at 3:00 AM)"
fi

echo "Cron jobs setup completed!"
echo ""
echo "Current crontab:"
crontab -l

