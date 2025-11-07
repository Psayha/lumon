#!/bin/bash
# Script for health checks
# Usage: ./health-check.sh [service-name]

set -e

SERVICE_NAME="${1:-all}"

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
    check_n8n
    check_postgresql
    check_nginx
    check_supabase_studio
else
    case "$SERVICE_NAME" in
        n8n) check_n8n ;;
        postgresql) check_postgresql ;;
        nginx) check_nginx ;;
        supabase-studio) check_supabase_studio ;;
        *) echo "Unknown service: $SERVICE_NAME" ;;
    esac
fi

