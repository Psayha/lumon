#!/bin/bash

# Скрипт для проверки правильности Nginx конфигураций
# Выполни: bash verify-nginx-configs.sh

echo "🔍 Проверка Nginx конфигураций..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Проверка 1: Активные симлинки
echo "📋 Проверка активных конфигов:"
EXPECTED_CONFIGS=("lumon-frontend" "n8n.psayha.ru" "sb.psayha.ru" "admin-panel")
ACTIVE_CONFIGS=$(ls /etc/nginx/sites-enabled/ 2>/dev/null)

for config in "${EXPECTED_CONFIGS[@]}"; do
    if echo "$ACTIVE_CONFIGS" | grep -q "^${config}$"; then
        echo -e "  ${GREEN}✅${NC} $config"
    else
        echo -e "  ${RED}❌${NC} $config - ОТСУТСТВУЕТ"
        ((ERRORS++))
    fi
done

# Проверка на неправильные конфиги
BAD_CONFIGS=("n8n-simple" "sb-simple")
for config in "${BAD_CONFIGS[@]}"; do
    if echo "$ACTIVE_CONFIGS" | grep -q "$config"; then
        echo -e "  ${RED}❌${NC} $config - НЕПРАВИЛЬНЫЙ КОНФИГ (удали его!)"
        ((ERRORS++))
    fi
done

# Проверка на дубли
DUPES=$(echo "$ACTIVE_CONFIGS" | grep -E ".*-[0-9]{4}$")
if [ ! -z "$DUPES" ]; then
    echo -e "  ${RED}❌${NC} Найдены дубли: $DUPES"
    ((ERRORS++))
fi

echo ""

# Проверка 2: Nginx конфигурация
echo "📋 Тест конфигурации Nginx:"
if sudo nginx -t 2>&1 | grep -q "test is successful"; then
    echo -e "  ${GREEN}✅${NC} Конфигурация валидна"
else
    echo -e "  ${RED}❌${NC} Конфигурация содержит ошибки"
    sudo nginx -t
    ((ERRORS++))
fi

echo ""

# Проверка 3: Локальные сервисы
echo "📋 Проверка локальных сервисов:"

# n8n
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5678 | grep -q "200"; then
    echo -e "  ${GREEN}✅${NC} n8n (127.0.0.1:5678) работает"
else
    echo -e "  ${RED}❌${NC} n8n (127.0.0.1:5678) не отвечает"
    ((ERRORS++))
fi

# Supabase Studio
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001 2>/dev/null | grep -qE "200|307"; then
    echo -e "  ${GREEN}✅${NC} Supabase Studio (127.0.0.1:3001) работает"
else
    echo -e "  ${RED}❌${NC} Supabase Studio (127.0.0.1:3001) не отвечает"
    ((ERRORS++))
fi

echo ""

# Проверка 4: Внешние домены
echo "📋 Проверка внешних доменов:"

DOMAINS=("psayha.ru" "n8n.psayha.ru" "sb.psayha.ru" "admin.psayha.ru")
for domain in "${DOMAINS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
        echo -e "  ${GREEN}✅${NC} $domain ($HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "  ${RED}❌${NC} $domain - НЕ ДОСТУПЕН"
        ((ERRORS++))
    else
        echo -e "  ${YELLOW}⚠️${NC} $domain - неожиданный код $HTTP_CODE"
        ((WARNINGS++))
    fi
done

echo ""

# Проверка 5: SSL сертификаты
echo "📋 Проверка SSL сертификатов:"
for domain in psayha.ru n8n.psayha.ru sb.psayha.ru admin.psayha.ru; do
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        EXPIRY=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/$domain/fullchain.pem 2>/dev/null | cut -d= -f2)
        DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            echo -e "  ${GREEN}✅${NC} $domain: истекает через $DAYS_LEFT дней"
        elif [ $DAYS_LEFT -gt 7 ]; then
            echo -e "  ${YELLOW}⚠️${NC} $domain: истекает через $DAYS_LEFT дней"
            ((WARNINGS++))
        else
            echo -e "  ${RED}❌${NC} $domain: истекает через $DAYS_LEFT дней - ОБНОВИ!"
            ((ERRORS++))
        fi
    else
        echo -e "  ${RED}❌${NC} $domain: сертификат не найден"
        ((ERRORS++))
    fi
done

echo ""

# Проверка 6: Последние ошибки
echo "📋 Последние ошибки Nginx:"
RECENT_ERRORS=$(sudo tail -20 /var/log/nginx/error.log 2>/dev/null | grep -v "No such file or directory" | tail -5)
if [ -z "$RECENT_ERRORS" ]; then
    echo -e "  ${GREEN}✅${NC} Критических ошибок не найдено"
else
    echo -e "  ${YELLOW}⚠️${NC} Найдены ошибки (последние 5):"
    echo "$RECENT_ERRORS" | sed 's/^/    /'
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Итоги
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ВСЁ В ПОРЯДКЕ!${NC} Все проверки пройдены."
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ ЕСТЬ ПРЕДУПРЕЖДЕНИЯ${NC} ($WARNINGS)"
    echo "Система работает, но есть моменты, требующие внимания."
else
    echo -e "${RED}❌ НАЙДЕНЫ ОШИБКИ${NC} ($ERRORS ошибок, $WARNINGS предупреждений)"
    echo ""
    echo "Рекомендации:"
    echo "1. Проверь /etc/nginx/sites-enabled/ на наличие неправильных конфигов"
    echo "2. Проверь логи: tail -50 /var/log/nginx/error.log"
    echo "3. При необходимости выполни: bash /var/www/docs/NGINX_MAINTENANCE.md"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

