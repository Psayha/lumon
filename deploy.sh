#!/bin/bash
# Скрипт для полного развертывания (Бэкенд + Админка)
# Использование: sudo bash deploy.sh

set -e  # Остановить при ошибке

echo "=================================================="
echo "🚀 Полное развертывание Lumon (API + Admin)"
echo "=================================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверка root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Ошибка: Запустите скрипт с sudo${NC}"
    exit 1
fi

# Переменные
PROJECT_DIR="/home/user/lumon"
WEBROOT="/var/www/lumon2"
BRANCH="main"

echo -e "${YELLOW}📂 Проект: ${PROJECT_DIR}${NC}"
echo -e "${YELLOW}🌿 Ветка: ${BRANCH}${NC}"
echo ""

cd "$PROJECT_DIR"

# 1. Git pull
echo -e "${GREEN}[1/4]${NC} 📥 Обновление кода..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo -e "${GREEN}✓${NC} Код обновлен"
echo ""

# 2. Бэкенд (API)
echo -e "${GREEN}[2/4]${NC} ⚙️  Развертывание API..."
cd "$PROJECT_DIR/back/api"

echo "  • Установка зависимостей..."
npm install --quiet

echo "  • Сборка приложения..."
npm run build

echo "  • Запуск миграций БД..."
npm run migration:run

echo "  • Перезапуск сервиса..."
systemctl restart lumon-api

echo -e "${GREEN}✓${NC} API успешно обновлен"
echo ""

# 3. Админ-панель
echo -e "${GREEN}[3/4]${NC} 🖥️  Развертывание Админки..."
cd "$PROJECT_DIR/adminpage"

echo "  • Установка зависимостей..."
npm install --quiet

echo "  • Настройка окружения..."
echo "VITE_API_URL=https://psayha.ru" > .env.production

echo "  • Сборка фронтенда..."
npm run build

echo "  • Копирование файлов..."
if [ -d "$WEBROOT/dist-admin" ]; then
    rm -rf "$WEBROOT/dist-admin"
fi
cp -r "$PROJECT_DIR/dist-admin" "$WEBROOT/"

# Права доступа
chown -R www-data:www-data "$WEBROOT/dist-admin"
chmod -R 755 "$WEBROOT/dist-admin"
find "$WEBROOT/dist-admin" -type f -exec chmod 644 {} \;

echo -e "${GREEN}✓${NC} Админка обновлена"
echo ""

# 4. Nginx
echo -e "${GREEN}[4/4]${NC} 🔄 Перезагрузка Nginx..."
if nginx -t > /dev/null 2>&1; then
    systemctl reload nginx
    echo -e "${GREEN}✓${NC} Nginx перезагружен"
else
    echo -e "${RED}❌ Ошибка конфигурации Nginx${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Все системы успешно обновлены!${NC}"
echo "=================================================="
