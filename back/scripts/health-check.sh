#!/bin/bash
# Script for health checks
# Usage: ./health-check.sh [service-name]

set -e

SERVICE_NAME="${1:-all}"

# Get system metrics
get_system_metrics() {
    # CPU usage (average over 1 second)
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    # Memory usage
    MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
    MEM_USED=$(free -m | awk '/^Mem:/{print $3}')
    MEM_AVAILABLE=$(free -m | awk '/^Mem:/{print $7}')
    MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
    
    # Disk usage (root partition)
    DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}' | sed 's/G//')
    DISK_USED=$(df -h / | awk 'NR==2 {print $3}' | sed 's/G//')
    DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
    DISK_PERCENT=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    echo "{\"service\": \"system\", \"status\": \"healthy\", \"metrics\": {\"cpu_usage_percent\": ${CPU_USAGE:-0}, \"memory_total_mb\": ${MEM_TOTAL:-0}, \"memory_used_mb\": ${MEM_USED:-0}, \"memory_available_mb\": ${MEM_AVAILABLE:-0}, \"memory_usage_percent\": ${MEM_PERCENT:-0}, \"disk_total_gb\": ${DISK_TOTAL:-0}, \"disk_used_gb\": ${DISK_USED:-0}, \"disk_available_gb\": ${DISK_AVAILABLE:-0}, \"disk_usage_percent\": ${DISK_PERCENT:-0}}}"
}

check_n8n() {
    echo "Checking n8n..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5678/healthz || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "{\"service\": \"n8n\", \"status\": \"healthy\", \"http_code\": $HTTP_CODE}"
    else
        echo "{\"service\": \"n8n\", \"status\": \"unhealthy\", \"http_code\": $HTTP_CODE}"
    fi
}

check_postgresql() {
    echo "Checking PostgreSQL..."
    PGHOST="${PGHOST:-supabase-db}"
    PGPORT="${PGPORT:-5432}"
    PGDATABASE="${PGDATABASE:-lumon}"
    PGUSER="${PGUSER:-postgres}"
    PGPASSWORD="${PGPASSWORD:-lumon_dev_password}"
    export PGPASSWORD
    
    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
        echo "{\"service\": \"postgresql\", \"status\": \"healthy\"}"
    else
        echo "{\"service\": \"postgresql\", \"status\": \"unhealthy\"}"
    fi
}

check_nginx() {
    echo "Checking Nginx..."
    if systemctl is-active --quiet nginx 2>/dev/null || pgrep nginx > /dev/null 2>&1; then
        echo "{\"service\": \"nginx\", \"status\": \"healthy\"}"
    else
        echo "{\"service\": \"nginx\", \"status\": \"unhealthy\"}"
    fi
}

check_supabase_studio() {
    echo "Checking Supabase Studio..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3001 || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
        echo "{\"service\": \"supabase-studio\", \"status\": \"healthy\", \"http_code\": $HTTP_CODE}"
    else
        echo "{\"service\": \"supabase-studio\", \"status\": \"unhealthy\", \"http_code\": $HTTP_CODE}"
    fi
}

if [ "$SERVICE_NAME" = "all" ]; then
    get_system_metrics
    check_n8n
    check_postgresql
    check_nginx
    check_supabase_studio
elif [ "$SERVICE_NAME" = "system" ]; then
    get_system_metrics
else
    case "$SERVICE_NAME" in
        n8n) check_n8n ;;
        postgresql) check_postgresql ;;
        nginx) check_nginx ;;
        supabase-studio) check_supabase_studio ;;
        *) echo "Unknown service: $SERVICE_NAME" ;;
    esac
fi

