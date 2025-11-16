#!/bin/bash
# 🔍 Полный чекап Lumon API системы

set -e

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

echo "╔═══════════════════════════════════════╗"
echo "║   🔍 Lumon API - Health Check        ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# 1. Проверка systemd сервиса
echo "═══ 1. Systemd Service ═══"
if systemctl is-active --quiet lumon-api; then
    success "lumon-api.service is running"
    systemctl status lumon-api --no-pager -l | grep -E "Active|Main PID|Memory|CPU"
else
    error "lumon-api.service is NOT running"
    exit 1
fi
echo ""

# 2. Проверка портов
echo "═══ 2. Ports ═══"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    success "Port 3000 is listening"
    netstat -tlnp | grep ":3000"
else
    error "Port 3000 is NOT listening"
fi

if netstat -tlnp 2>/dev/null | grep -q ":5432"; then
    success "PostgreSQL (5432) is running"
else
    warning "PostgreSQL port 5432 not detected"
fi
echo ""

# 3. Проверка Docker контейнеров
echo "═══ 3. Docker Containers ═══"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "lumon|postgres|supabase"; then
    success "Docker containers running"
else
    warning "No Lumon docker containers found"
fi
echo ""

# 4. Проверка Nginx
echo "═══ 4. Nginx ═══"
if systemctl is-active --quiet nginx; then
    success "Nginx is running"
    nginx -t 2>&1 | grep -E "ok|successful"
else
    error "Nginx is NOT running"
fi
echo ""

# 5. Проверка API endpoints
echo "═══ 5. API Endpoints ═══"

# Health endpoint (local)
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    success "http://localhost:3000/health"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
else
    error "http://localhost:3000/health - FAILED"
fi
echo ""

# Health endpoint (nginx HTTP)
if curl -s http://n8n.psayha.ru/health > /dev/null 2>&1; then
    success "http://n8n.psayha.ru/health"
else
    warning "http://n8n.psayha.ru/health - FAILED"
fi

# Health endpoint (nginx HTTPS)
if curl -s https://n8n.psayha.ru/health > /dev/null 2>&1; then
    success "https://n8n.psayha.ru/health"
else
    warning "https://n8n.psayha.ru/health - FAILED"
fi
echo ""

# 6. Проверка логов (последние ошибки)
echo "═══ 6. Recent Logs ═══"
if journalctl -u lumon-api --since "5 minutes ago" | grep -q ERROR; then
    warning "Found ERRORs in last 5 minutes:"
    journalctl -u lumon-api --since "5 minutes ago" | grep ERROR | tail -3
else
    success "No errors in last 5 minutes"
fi
echo ""

# 7. Проверка подключения к БД
echo "═══ 7. Database Connection ═══"
if PGPASSWORD=lumon_dev_password psql -h 127.0.0.1 -U postgres -d lumon -c "SELECT version();" > /dev/null 2>&1; then
    success "PostgreSQL connection OK"
    PGPASSWORD=lumon_dev_password psql -h 127.0.0.1 -U postgres -d lumon -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';"
else
    warning "Cannot connect to PostgreSQL (psql not installed or connection failed)"
fi
echo ""

# 8. Проверка SSL сертификатов
echo "═══ 8. SSL Certificates ═══"
if [ -f "/etc/letsencrypt/live/n8n.psayha.ru/fullchain.pem" ]; then
    success "SSL certificate exists for n8n.psayha.ru"
    openssl x509 -in /etc/letsencrypt/live/n8n.psayha.ru/fullchain.pem -noout -dates 2>/dev/null | grep -E "notAfter"
else
    warning "SSL certificate not found"
fi
echo ""

# 9. Disk usage
echo "═══ 9. Disk Usage ═══"
df -h /home/user/lumon | tail -1
echo ""

# 10. Memory usage
echo "═══ 10. Memory Usage ═══"
free -h | grep -E "Mem|Swap"
echo ""

echo "╔═══════════════════════════════════════╗"
echo "║   ✅ Health Check Complete            ║"
echo "╚═══════════════════════════════════════╝"
