#!/bin/bash
# 🚀 Простой деплой на сервер - ОДНА КОМАНДА
# Запуск: curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/claude/n8n-backend-discussion-01EyCeQ9q98KrPg4HanTuzyr/back/api/SIMPLE_DEPLOY.sh | bash

set -e

echo "╔═══════════════════════════════════════╗"
echo "║   🚀 Lumon API - Простой Деплой      ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "${BLUE}▶${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# 1. Проверка что мы на сервере
step "Проверка окружения..."
if [ ! -d "/etc/nginx" ]; then
    warning "Nginx не установлен. Установить? (y/n)"
    read -p "> " install_nginx
    if [ "$install_nginx" = "y" ]; then
        sudo apt update
        sudo apt install -y nginx
    fi
fi

# 2. Проверка что проект склонирован
if [ ! -d "/home/user/lumon" ]; then
    error "Проект не найден в /home/user/lumon"
    echo ""
    echo "Сначала склонируйте проект:"
    echo "  cd /home/user"
    echo "  git clone YOUR_REPO_URL lumon"
    echo "  cd lumon"
    echo "  git checkout claude/n8n-backend-discussion-01EyCeQ9q98KrPg4HanTuzyr"
    echo ""
    exit 1
fi

cd /home/user/lumon/back/api
success "Проект найден: $(pwd)"

# 3. Проверка .env
if [ ! -f ".env" ]; then
    error ".env файл не найден!"
    echo ""
    echo "Создайте .env файл:"
    echo "  cd /home/user/lumon/back/api"
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    echo ""
    echo "Заполните все поля и запустите скрипт снова"
    exit 1
fi

# Проверка что .env заполнен
if grep -q "your-supabase-password" .env; then
    error ".env не заполнен!"
    echo "Отредактируйте .env: nano .env"
    exit 1
fi

success ".env файл настроен"

# 4. Install dependencies
step "Установка зависимостей..."
npm ci --production --silent
success "Зависимости установлены"

# 5. Build
step "Сборка проекта..."
npm run build
if [ ! -d "dist" ]; then
    error "Сборка не удалась!"
    exit 1
fi
success "Проект собран"

# 6. Install systemd service
step "Установка systemd service..."
sudo cp lumon-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lumon-api
success "Service установлен"

# 7. Start service
step "Запуск сервиса..."
sudo systemctl restart lumon-api
sleep 2

if sudo systemctl is-active --quiet lumon-api; then
    success "Сервис запущен!"
else
    error "Не удалось запустить сервис"
    echo "Проверьте логи: sudo journalctl -u lumon-api -n 50"
    exit 1
fi

# 8. Test API
step "Проверка API..."
sleep 1
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    success "API работает!"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
else
    error "API не отвечает"
    echo "Проверьте логи: sudo journalctl -u lumon-api -f"
    exit 1
fi

# 9. Install nginx config
step "Настройка Nginx..."
sudo cp nginx-lumon-api.conf /etc/nginx/sites-available/lumon-api

if [ ! -L "/etc/nginx/sites-enabled/lumon-api" ]; then
    sudo ln -s /etc/nginx/sites-available/lumon-api /etc/nginx/sites-enabled/
fi

if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    success "Nginx настроен"
else
    error "Ошибка в конфиге nginx"
    sudo nginx -t
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   ✅ ДЕПЛОЙ ЗАВЕРШЕН!                ║"
echo "╚═══════════════════════════════════════╝"
echo ""

success "API запущен и работает!"
echo ""
echo "═══ Проверка ═══"
echo ""
echo "  Локально:  curl http://localhost:3000/health"
echo "  Через nginx: curl http://n8n.psayha.ru/health"
echo ""
echo "═══ Следующий шаг ═══"
echo ""
echo "Установите SSL сертификат:"
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d n8n.psayha.ru"
echo ""
echo "═══ Управление ═══"
echo ""
echo "  Статус:     sudo systemctl status lumon-api"
echo "  Перезапуск: sudo systemctl restart lumon-api"
echo "  Логи:       sudo journalctl -u lumon-api -f"
echo ""

success "Готово! 🚀"
