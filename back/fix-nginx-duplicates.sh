#!/bin/bash

# Скрипт для поиска и удаления дублирующихся server_name в nginx
# Использование: ./fix-nginx-duplicates.sh

echo "🔍 Поиск дублирующихся server_name в nginx..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Домены для проверки
DOMAINS=("n8n.psayha.ru" "sb.psayha.ru" "admin.psayha.ru")

# Функция для поиска всех конфигов с указанным server_name
find_domain_configs() {
    local domain=$1
    echo -e "${YELLOW}📋 Ищем конфиги для: $domain${NC}"
    
    # Ищем в conf.d
    echo "  /etc/nginx/conf.d/:"
    sudo grep -r "server_name.*$domain" /etc/nginx/conf.d/ 2>/dev/null | while read line; do
        file=$(echo "$line" | cut -d: -f1)
        echo "    - $file"
    done
    
    # Ищем в sites-available
    echo "  /etc/nginx/sites-available/:"
    sudo grep -r "server_name.*$domain" /etc/nginx/sites-available/ 2>/dev/null | while read line; do
        file=$(echo "$line" | cut -d: -f1)
        echo "    - $file"
    done
    
    # Ищем в sites-enabled
    echo "  /etc/nginx/sites-enabled/:"
    sudo grep -r "server_name.*$domain" /etc/nginx/sites-enabled/ 2>/dev/null | while read line; do
        file=$(echo "$line" | cut -d: -f1)
        echo "    - $file"
    done
    
    echo ""
}

# Функция для определения правильного конфига
get_correct_config() {
    local domain=$1
    
    case $domain in
        "n8n.psayha.ru")
            echo "/etc/nginx/conf.d/n8n.conf"
            ;;
        "sb.psayha.ru")
            echo "/etc/nginx/conf.d/sb.conf"
            ;;
        "admin.psayha.ru")
            echo "/etc/nginx/sites-available/admin-panel"
            ;;
    esac
}

# Шаг 1: Найти все дубли
echo "═══════════════════════════════════════════════════════════"
echo "ШАГ 1: Поиск всех конфигов с server_name"
echo "═══════════════════════════════════════════════════════════"
echo ""

for domain in "${DOMAINS[@]}"; do
    find_domain_configs "$domain"
done

# Шаг 2: Показать правильные конфиги
echo "═══════════════════════════════════════════════════════════"
echo "ШАГ 2: Правильные конфиги (которые должны остаться)"
echo "═══════════════════════════════════════════════════════════"
echo ""

for domain in "${DOMAINS[@]}"; do
    correct=$(get_correct_config "$domain")
    if [ -f "$correct" ]; then
        echo -e "${GREEN}✅ $domain → $correct${NC}"
    else
        echo -e "${RED}❌ $domain → $correct (НЕ НАЙДЕН!)${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "ШАГ 3: Конфиги для удаления (дубли)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Список файлов для удаления
FILES_TO_REMOVE=(
    "/etc/nginx/sites-enabled/n8n"
    "/etc/nginx/sites-enabled/sb"
    "/etc/nginx/sites-enabled/n8n-simple"
    "/etc/nginx/sites-enabled/sb-simple"
    "/etc/nginx/sites-enabled/admin"
    "/etc/nginx/sites-available/n8n-simple"
    "/etc/nginx/sites-available/sb-simple"
    "/etc/nginx/sites-available/lumon-n8n"
    "/etc/nginx/sites-available/n8n.psayha.ru"
    "/etc/nginx/sites-available/sb.psayha.ru"
)

echo "Файлы, которые можно безопасно удалить:"
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ] || [ -L "$file" ]; then
        echo -e "${YELLOW}  - $file${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "⚠️  ВНИМАНИЕ: Перед удалением проверь nginx -t"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Проверка синтаксиса nginx
echo "Проверка синтаксиса nginx..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✅ Синтаксис nginx корректен${NC}"
else
    echo -e "${RED}❌ Ошибка в конфигурации nginx!${NC}"
    sudo nginx -t
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📝 ИНСТРУКЦИЯ:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Проверь список файлов выше"
echo "2. Удали дублирующиеся конфиги:"
echo ""
echo "   sudo rm -f /etc/nginx/sites-enabled/n8n"
echo "   sudo rm -f /etc/nginx/sites-enabled/sb"
echo "   sudo rm -f /etc/nginx/sites-enabled/n8n-simple"
echo "   sudo rm -f /etc/nginx/sites-enabled/sb-simple"
echo "   sudo rm -f /etc/nginx/sites-enabled/admin"
echo ""
echo "3. Убедись, что правильные конфиги на месте:"
echo "   - /etc/nginx/conf.d/n8n.conf (для n8n.psayha.ru)"
echo "   - /etc/nginx/conf.d/sb.conf (для sb.psayha.ru)"
echo "   - /etc/nginx/sites-enabled/admin-panel → /etc/nginx/sites-available/admin-panel"
echo ""
echo "4. Проверь синтаксис: sudo nginx -t"
echo "5. Перезагрузи nginx: sudo systemctl reload nginx"
echo ""

