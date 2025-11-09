#!/bin/bash
# Cron script for automatic health checks
# This script calls the health-check webhook via n8n

set -e

# Configuration
N8N_URL="${N8N_URL:-http://localhost:5678}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
WEBHOOK_URL="${N8N_URL}/webhook/health-check"
ALERT_EMAIL="${ALERT_EMAIL:-}"
ALERT_TELEGRAM_BOT_TOKEN="${ALERT_TELEGRAM_BOT_TOKEN:-}"
ALERT_TELEGRAM_CHAT_ID="${ALERT_TELEGRAM_CHAT_ID:-}"

# Log file
LOG_FILE="/var/log/lumon/cron-health-check.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting automatic health check..."

# Call health-check webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"service": "all"}' || echo "ERROR")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    log "Health check completed successfully"
    log "Response: $BODY"
    
    # Check if system is unhealthy
    if echo "$BODY" | grep -q '"overall_status":"unhealthy"\|"overall_status":"down"'; then
        log "WARNING: System is unhealthy!"
        # Send alert notification
        if [ -n "$ALERT_EMAIL" ]; then
            echo "System health check failed. Status: $(echo "$BODY" | grep -o '"overall_status":"[^"]*"')" | mail -s "Lumon Health Check Alert" "$ALERT_EMAIL" 2>/dev/null || true
        fi
        if [ -n "$ALERT_TELEGRAM_BOT_TOKEN" ] && [ -n "$ALERT_TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot${ALERT_TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d "chat_id=${ALERT_TELEGRAM_CHAT_ID}" \
                -d "text=⚠️ Lumon Health Check Alert: System is unhealthy" \
                -d "parse_mode=HTML" > /dev/null 2>&1 || true
        fi
    fi
    
    exit 0
else
    log "ERROR: Health check failed with HTTP code $HTTP_CODE"
    log "Response: $BODY"
    exit 1
fi

