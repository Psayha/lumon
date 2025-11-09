#!/bin/bash
# Cron script for automatic backups
# This script calls the backup-create webhook via n8n

set -e

# Configuration
N8N_URL="${N8N_URL:-http://localhost:5678}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
WEBHOOK_URL="${N8N_URL}/webhook/backup-create"
ALERT_EMAIL="${ALERT_EMAIL:-}"
ALERT_TELEGRAM_BOT_TOKEN="${ALERT_TELEGRAM_BOT_TOKEN:-}"
ALERT_TELEGRAM_CHAT_ID="${ALERT_TELEGRAM_CHAT_ID:-}"

# Log file
LOG_FILE="/var/log/lumon/cron-backup.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting automatic backup..."

# Call backup-create webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' || echo "ERROR")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    log "Backup created successfully"
    log "Response: $BODY"
    exit 0
else
    log "ERROR: Backup failed with HTTP code $HTTP_CODE"
    log "Response: $BODY"
    # Send alert notification
    if [ -n "$ALERT_EMAIL" ]; then
        echo "Backup failed with HTTP code $HTTP_CODE. Response: $BODY" | mail -s "Lumon Backup Alert" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    if [ -n "$ALERT_TELEGRAM_BOT_TOKEN" ] && [ -n "$ALERT_TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${ALERT_TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${ALERT_TELEGRAM_CHAT_ID}" \
            -d "text=❌ Lumon Backup Alert: Backup failed (HTTP $HTTP_CODE)" \
            -d "parse_mode=HTML" > /dev/null 2>&1 || true
    fi
    exit 1
fi

