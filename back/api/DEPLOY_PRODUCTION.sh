#!/bin/bash
# 🚀 Production Deployment Instructions
# Lumon NestJS API → n8n.psayha.ru

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  📋 Lumon API Production Deployment Guide              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_step() {
    echo -e "${BLUE}▶${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 1: Pre-deployment Checklist"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Необходимая информация для .env:"
echo ""
echo "  1. Supabase Database:"
echo "     - DB_HOST (например: db.xxxxx.supabase.co)"
echo "     - DB_PASSWORD"
echo ""
echo "  2. OpenAI API Key:"
echo "     - Получить на: https://platform.openai.com/api-keys"
echo ""
echo "  3. Telegram Bot Token:"
echo "     - Получить у @BotFather"
echo ""
echo "  4. Admin Credentials:"
echo "     - ADMIN_USERNAME (на ваш выбор)"
echo "     - ADMIN_PASSWORD (на ваш выбор, минимум 12 символов)"
echo ""

read -p "У вас есть вся эта информация? (y/n): " has_info
if [ "$has_info" != "y" ]; then
    echo_warning "Соберите необходимую информацию и запустите скрипт снова"
    exit 0
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 2: Navigate to API directory"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Переходим в директорию API..."
cd /home/user/lumon/back/api
echo_success "Текущая директория: $(pwd)"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 3: Configure Environment"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f ".env" ]; then
    echo_warning ".env файл уже существует"
    read -p "Перезаписать? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo_step "Используем существующий .env файл"
    else
        echo_step "Создаем новый .env файл..."
        cp .env.production.example .env
        echo_success ".env файл создан"
    fi
else
    echo_step "Создаем .env файл из шаблона..."
    cp .env.production.example .env
    echo_success ".env файл создан"
fi

echo ""
echo_warning "ВАЖНО: Отредактируйте .env файл!"
echo ""
echo "Откройте .env в редакторе:"
echo "  nano .env"
echo ""
echo "Заполните следующие поля:"
echo "  - DB_HOST=db.xxxxx.supabase.co"
echo "  - DB_PASSWORD=your-supabase-password"
echo "  - OPENAI_API_KEY=sk-..."
echo "  - TELEGRAM_BOT_TOKEN=123456:ABC..."
echo "  - ADMIN_USERNAME=admin"
echo "  - ADMIN_PASSWORD=secure_password"
echo ""

read -p "Нажмите Enter чтобы открыть редактор .env..."
nano .env

echo ""
echo_step "Проверяем .env файл..."

# Check if required variables are set
if grep -q "DB_PASSWORD=your-supabase-password" .env || \
   grep -q "OPENAI_API_KEY=$" .env || \
   grep -q "TELEGRAM_BOT_TOKEN=$" .env; then
    echo_error "Некоторые переменные не заполнены!"
    echo "Пожалуйста, заполните все поля в .env"
    exit 1
fi

echo_success ".env файл настроен"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 4: Install Dependencies & Build"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Устанавливаем зависимости (это может занять 1-2 минуты)..."
npm ci --production

echo ""
echo_step "Собираем приложение..."
npm run build

if [ ! -d "dist" ]; then
    echo_error "Сборка не удалась!"
    exit 1
fi

echo_success "Приложение успешно собрано"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 5: Install Systemd Service"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Устанавливаем systemd service..."

if [ ! -f "/etc/systemd/system/lumon-api.service" ]; then
    sudo cp lumon-api.service /etc/systemd/system/
    sudo systemctl daemon-reload
    echo_success "Systemd service установлен"
else
    echo_warning "Systemd service уже существует"
    read -p "Обновить? (y/n): " update_service
    if [ "$update_service" = "y" ]; then
        sudo cp lumon-api.service /etc/systemd/system/
        sudo systemctl daemon-reload
        echo_success "Systemd service обновлен"
    fi
fi

echo ""
echo_step "Запускаем сервис..."
sudo systemctl enable lumon-api
sudo systemctl start lumon-api

sleep 2

if sudo systemctl is-active --quiet lumon-api; then
    echo_success "Lumon API успешно запущен!"
else
    echo_error "Не удалось запустить сервис"
    echo "Проверьте логи: sudo journalctl -u lumon-api -n 50"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 6: Test API Locally"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Тестируем API на localhost:3000..."

sleep 1

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo_success "Health check: OK"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
else
    echo_error "API не отвечает на localhost:3000"
    echo "Проверьте логи: sudo journalctl -u lumon-api -f"
    exit 1
fi

echo ""
echo_step "Тестируем auth endpoint..."
curl -s -X POST http://localhost:3000/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}' | head -c 200
echo ""
echo_success "Auth endpoint отвечает (ошибка валидации ожидаема)"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 7: Install & Configure Nginx"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo_step "Nginx не установлен. Устанавливаем..."
    sudo apt update
    sudo apt install -y nginx
    echo_success "Nginx установлен"
else
    echo_success "Nginx уже установлен"
fi

echo ""
echo_step "Копируем конфигурацию nginx..."

sudo cp nginx-lumon-api.conf /etc/nginx/sites-available/lumon-api

if [ ! -L "/etc/nginx/sites-enabled/lumon-api" ]; then
    sudo ln -s /etc/nginx/sites-available/lumon-api /etc/nginx/sites-enabled/
    echo_success "Symlink создан"
else
    echo_warning "Symlink уже существует"
fi

echo ""
echo_step "Проверяем конфигурацию nginx..."
if sudo nginx -t; then
    echo_success "Конфигурация nginx валидна"
else
    echo_error "Ошибка в конфигурации nginx!"
    exit 1
fi

echo ""
echo_step "Перезагружаем nginx..."
sudo systemctl reload nginx
echo_success "Nginx перезагружен"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 8: Setup SSL Certificate"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_warning "SSL сертификат нужен для production!"
echo ""
read -p "Установить SSL сертификат сейчас? (y/n): " install_ssl

if [ "$install_ssl" = "y" ]; then
    if ! command -v certbot &> /dev/null; then
        echo_step "Устанавливаем certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi

    echo ""
    echo_step "Получаем SSL сертификат для n8n.psayha.ru..."
    echo_warning "Убедитесь что DNS настроен правильно!"

    sudo certbot --nginx -d n8n.psayha.ru

    echo_success "SSL сертификат установлен"
else
    echo_warning "SSL пропущен. Установите позже командой:"
    echo "  sudo certbot --nginx -d n8n.psayha.ru"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 9: Test API via Nginx"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Тестируем API через nginx..."

# Determine protocol
if [ "$install_ssl" = "y" ]; then
    PROTO="https"
else
    PROTO="http"
fi

if curl -s ${PROTO}://n8n.psayha.ru/health > /dev/null 2>&1; then
    echo_success "API доступен через ${PROTO}://n8n.psayha.ru/health"
    curl -s ${PROTO}://n8n.psayha.ru/health | python3 -m json.tool 2>/dev/null
else
    echo_warning "API не доступен через nginx"
    echo "Проверьте:"
    echo "  - DNS записи для n8n.psayha.ru"
    echo "  - Firewall (порты 80, 443)"
    echo "  - Nginx конфиг: sudo nginx -t"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 10: Update Frontend"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_step "Обновляем frontend конфигурацию..."

cd /home/user/lumon

if [ "$install_ssl" = "y" ]; then
    echo "VITE_API_URL=https://n8n.psayha.ru" > .env.production
    echo_success "Frontend будет использовать https://n8n.psayha.ru"
else
    echo "VITE_API_URL=http://n8n.psayha.ru" > .env.production
    echo_success "Frontend будет использовать http://n8n.psayha.ru"
fi

echo ""
read -p "Пересобрать frontend сейчас? (y/n): " rebuild_frontend

if [ "$rebuild_frontend" = "y" ]; then
    echo_step "Собираем frontend..."
    npm run build
    echo_success "Frontend пересобран"
else
    echo_warning "Пересоберите frontend позже: npm run build"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""

echo_success "Lumon NestJS API успешно задеплоен!"
echo ""
echo "═══ Статус сервисов ═══"
echo ""
sudo systemctl status lumon-api --no-pager | head -10
echo ""
echo "═══ API Endpoints ═══"
echo ""
if [ "$install_ssl" = "y" ]; then
    echo "  Health Check: https://n8n.psayha.ru/health"
    echo "  Auth Init:    https://n8n.psayha.ru/webhook/auth-init-v2"
    echo "  Admin Login:  https://n8n.psayha.ru/webhook/admin/login"
else
    echo "  Health Check: http://n8n.psayha.ru/health"
    echo "  Auth Init:    http://n8n.psayha.ru/webhook/auth-init-v2"
    echo "  Admin Login:  http://n8n.psayha.ru/webhook/admin/login"
fi
echo ""
echo "═══ Управление ═══"
echo ""
echo "  Статус:     sudo systemctl status lumon-api"
echo "  Перезапуск: sudo systemctl restart lumon-api"
echo "  Логи:       sudo journalctl -u lumon-api -f"
echo "  Остановить: sudo systemctl stop lumon-api"
echo ""
echo "═══ Следующие шаги ═══"
echo ""
echo "  1. Протестируйте API через браузер:"
if [ "$install_ssl" = "y" ]; then
    echo "     https://n8n.psayha.ru/health"
else
    echo "     http://n8n.psayha.ru/health"
fi
echo ""
echo "  2. Протестируйте через frontend:"
echo "     - Залогиньтесь через Telegram"
echo "     - Создайте чат"
echo "     - Отправьте сообщение"
echo ""
echo "  3. Мониторьте логи 24 часа:"
echo "     sudo journalctl -u lumon-api -f"
echo ""
echo "  4. После успешного тестирования:"
echo "     - Можно остановить старый n8n"
echo "     - Или оставить как backup на n8n-backup.psayha.ru"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

echo_success "Готово! 🚀"
