#!/bin/bash
# Скрипт для развертывания админ-панели на production сервере
# Использование: sudo bash deploy-admin.sh

set -e  # Остановить при ошибке

echo "=================================================="
echo "🚀 Развертывание админ-панели Lumon"
echo "=================================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка что запущен от root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Ошибка: Запустите скрипт с sudo${NC}"
    echo "Использование: sudo bash deploy-admin.sh"
    exit 1
fi

# Переменные
PROJECT_DIR="/home/user/lumon"
WEBROOT="/var/www/lumon2"
BRANCH="main"

echo -e "${YELLOW}📂 Рабочая директория: ${PROJECT_DIR}${NC}"
echo -e "${YELLOW}🌐 Веб-сервер: ${WEBROOT}${NC}"
echo -e "${YELLOW}🌿 Ветка: ${BRANCH}${NC}"
echo ""

# Проверка что директория проекта существует
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Ошибка: Директория ${PROJECT_DIR} не существует${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. Git pull
echo -e "${GREEN}[1/7]${NC} 📥 Получение последних изменений из git..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo -e "${GREEN}✓${NC} Git обновлен"
echo ""

# 2. Установка зависимостей админки
echo -e "${GREEN}[2/7]${NC} 📦 Установка зависимостей админки..."
cd "$PROJECT_DIR/adminpage"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: adminpage/package.json не найден${NC}"
    exit 1
fi

npm install
echo -e "${GREEN}✓${NC} Зависимости установлены"
echo ""

# 3. Сборка админки
echo -e "${GREEN}[3/7]${NC} 🏗️  Сборка админ-панели..."
# Создание .env.production для корректного API URL
echo "VITE_API_URL=https://psayha.ru" > .env.production

npm run build
echo -e "${GREEN}✓${NC} Сборка завершена"
echo ""

# 4. Проверка что сборка создана
if [ ! -d "$PROJECT_DIR/dist-admin" ]; then
    echo -e "${RED}❌ Ошибка: dist-admin не создан после сборки${NC}"
    exit 1
fi

echo -e "${GREEN}[4/7]${NC} 🔍 Проверка сборки..."
if [ ! -f "$PROJECT_DIR/dist-admin/index.html" ]; then
    echo -e "${RED}❌ Ошибка: dist-admin/index.html не найден${NC}"
    exit 1
fi

# Проверка что index.html содержит правильные ссылки
if grep -q "src=\"/main.tsx\"" "$PROJECT_DIR/dist-admin/index.html"; then
    echo -e "${RED}❌ Ошибка: index.html содержит ссылку на /main.tsx (dev версия)${NC}"
    echo -e "${RED}   Ожидается production build с /assets/index-*.js${NC}"
    exit 1
fi

if ! grep -q "assets/index-" "$PROJECT_DIR/dist-admin/index.html"; then
    echo -e "${RED}❌ Ошибка: index.html не содержит ссылок на assets${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Сборка валидна"
echo ""

# 5. Удаление старой версии
echo -e "${GREEN}[5/7]${NC} 🗑️  Удаление старой версии..."
if [ -d "$WEBROOT/dist-admin" ]; then
    rm -rf "$WEBROOT/dist-admin"
    echo -e "${GREEN}✓${NC} Старая версия удалена"
else
    echo -e "${YELLOW}⚠${NC}  Старая версия не найдена (первый деплой?)"
fi
echo ""

# 6. Копирование новой версии
echo -e "${GREEN}[6/7]${NC} 📋 Копирование новой версии..."
cp -r "$PROJECT_DIR/dist-admin" "$WEBROOT/"

# Установка правильных прав
chown -R www-data:www-data "$WEBROOT/dist-admin"
chmod -R 755 "$WEBROOT/dist-admin"
find "$WEBROOT/dist-admin" -type f -exec chmod 644 {} \;

echo -e "${GREEN}✓${NC} Файлы скопированы"
echo ""

# 7. Перезагрузка nginx
echo -e "${GREEN}[7/7]${NC} 🔄 Перезагрузка nginx..."

# Проверка конфигурации
if ! nginx -t > /dev/null 2>&1; then
    echo -e "${RED}❌ Ошибка: Конфигурация nginx невалидна${NC}"
    nginx -t
    exit 1
fi

systemctl reload nginx
echo -e "${GREEN}✓${NC} Nginx перезагружен"
echo ""

# Финальная проверка
echo "=================================================="
echo -e "${GREEN}✅ Развертывание завершено успешно!${NC}"
echo "=================================================="
echo ""
echo "📊 Статистика развертывания:"
echo ""
echo "  • Сборка: $(ls -lh $PROJECT_DIR/dist-admin/index.html | awk '{print $5}') (index.html)"
echo "  • Assets: $(ls -1 $PROJECT_DIR/dist-admin/assets/*.css $PROJECT_DIR/dist-admin/assets/*.js 2>/dev/null | wc -l) файлов"
echo "  • Размер: $(du -sh $WEBROOT/dist-admin | awk '{print $1}')"
echo ""
echo "🌐 Проверьте результат:"
echo ""
echo "  1. Откройте: https://admin.psayha.ru"
echo "  2. Нажмите: Ctrl+Shift+R (hard refresh)"
echo "  3. Проверьте: F12 → Console (не должно быть ошибок)"
echo ""

# Проверка HTTP ответа
echo "🔍 Быстрая проверка доступности..."
if command -v curl > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/dist-admin/ -H "Host: admin.psayha.ru")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓${NC} HTTP код: $HTTP_CODE (OK)"
    else
        echo -e "${YELLOW}⚠${NC}  HTTP код: $HTTP_CODE (проверьте nginx конфигурацию)"
    fi
fi

echo ""
echo "=================================================="
