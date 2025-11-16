#!/bin/bash
# 🚀 Скрипт деплоя Lumon API на сервер
# Запускать НА СЕРВЕРЕ после git pull

set -e

echo "╔═══════════════════════════════════════╗"
echo "║   🚀 Lumon API - Деплой на сервер   ║"
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

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    error "Запустите этот скрипт из директории /home/user/lumon/back/api"
    exit 1
fi

step "1. Проверка окружения..."
if [ ! -d "/etc/nginx" ]; then
    error "Nginx не установлен!"
    exit 1
fi
success "Nginx установлен"

# Проверка что .env существует
if [ ! -f ".env" ]; then
    error ".env файл не найден!"
    echo ""
    echo "Файл .env должен быть создан с правильными данными."
    echo "Убедитесь что git pull прошел успешно и .env файл есть в проекте."
    exit 1
fi
success ".env файл найден"

step "2. Установка зависимостей..."
npm ci --silent
success "Зависимости установлены"

step "3. Сборка проекта..."
npm run build
if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
    error "Сборка не удалась!"
    exit 1
fi
success "Проект собран"

step "4. Установка systemd сервиса..."
sudo cp lumon-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lumon-api
success "Systemd сервис установлен"

step "5. Запуск API сервиса..."
sudo systemctl restart lumon-api
sleep 3

if sudo systemctl is-active --quiet lumon-api; then
    success "API сервис запущен!"
else
    error "Не удалось запустить API сервис"
    echo "Проверьте логи: sudo journalctl -u lumon-api -n 50"
    exit 1
fi

step "6. Проверка что API отвечает..."
sleep 2
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    success "API работает на порту 3000!"
else
    warning "API не отвечает на /health (это нормально если нет health endpoint)"
    echo "Проверяем что порт слушается..."
    if sudo netstat -tlnp | grep -q ":3000"; then
        success "Порт 3000 слушается"
    else
        error "Порт 3000 не слушается!"
        echo "Проверьте логи: sudo journalctl -u lumon-api -f"
        exit 1
    fi
fi

step "7. Обновление nginx конфигурации..."

# Бэкап старого конфига
if [ -f "/etc/nginx/sites-available/n8n.psayha.ru" ]; then
    sudo cp /etc/nginx/sites-available/n8n.psayha.ru /etc/nginx/sites-available/n8n.psayha.ru.backup.$(date +%Y%m%d-%H%M%S)
    success "Старый конфиг сохранен в backup"
fi

# Копируем новый конфиг
sudo cp nginx-lumon-api.conf /etc/nginx/sites-available/lumon-api

# Создаем симлинк если не существует
if [ ! -L "/etc/nginx/sites-enabled/lumon-api" ]; then
    sudo ln -s /etc/nginx/sites-available/lumon-api /etc/nginx/sites-enabled/
    success "Создан симлинк для lumon-api"
fi

# Проверяем конфиг nginx
if sudo nginx -t 2>&1 | grep -q "successful"; then
    success "Nginx конфиг валидный"
    sudo systemctl reload nginx
    success "Nginx перезагружен"
else
    error "Ошибка в конфиге nginx"
    sudo nginx -t
    exit 1
fi

step "8. Остановка старого n8n контейнера..."
if docker ps | grep -q "lumon-n8n"; then
    docker stop lumon-n8n
    success "Старый n8n контейнер остановлен"
else
    warning "Контейнер lumon-n8n не найден или уже остановлен"
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   ✅ ДЕПЛОЙ ЗАВЕРШЕН!                ║"
echo "╚═══════════════════════════════════════╝"
echo ""

success "Миграция с n8n на NestJS API завершена!"
echo ""
echo "═══ Проверка ═══"
echo ""
echo "  Локально:     curl http://localhost:3000/health"
echo "  Через nginx:  curl https://n8n.psayha.ru/health"
echo ""
echo "═══ Управление ═══"
echo ""
echo "  Статус:       sudo systemctl status lumon-api"
echo "  Перезапуск:   sudo systemctl restart lumon-api"
echo "  Логи:         sudo journalctl -u lumon-api -f"
echo "  Логи nginx:   sudo tail -f /var/log/nginx/lumon-api-access.log"
echo ""
echo "═══ Откат (если нужен) ═══"
echo ""
echo "  Запустить n8n обратно:"
echo "    docker start lumon-n8n"
echo ""
echo "  Вернуть старый nginx конфиг:"
echo "    sudo cp /etc/nginx/sites-available/n8n.psayha.ru.backup.* /etc/nginx/sites-available/n8n.psayha.ru"
echo "    sudo systemctl reload nginx"
echo ""

success "Готово! 🚀"
echo ""
echo "Теперь протестируйте API через ваш фронтенд:"
echo "  https://n8n.psayha.ru"
echo ""
