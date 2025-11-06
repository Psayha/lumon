#!/bin/bash

# Скрипт для удаления неактуальных nginx конфигов на сервере
# Выполни: sudo bash cleanup-server-nginx.sh

echo "🧹 Очистка неактуальных nginx конфигов на сервере..."
echo ""

REMOVED=0

# Удаляем неактуальные конфиги из sites-available
echo "📋 Удаление неактуальных конфигов из /etc/nginx/sites-available/:"

OLD_CONFIGS=(
    "nginx-admin"
    "nginx-frontend"
    "nginx-n8n"
    "nginx-sb"
    "n8n-simple"
    "sb-simple"
    "nginx-simple-n8n"
    "nginx-simple-sb"
    "nginx-cors-map"
)

for config in "${OLD_CONFIGS[@]}"; do
    if [ -f "/etc/nginx/sites-available/$config" ] || [ -f "/etc/nginx/sites-available/${config}.conf" ]; then
        echo "  🗑️ Удаляю $config"
        sudo rm -f "/etc/nginx/sites-available/$config" "/etc/nginx/sites-available/${config}.conf"
        ((REMOVED++))
    fi
done

echo ""
echo "📋 Удаление неактуальных симлинков из /etc/nginx/sites-enabled/:"

# Удаляем неактуальные симлинки из sites-enabled
for config in "${OLD_CONFIGS[@]}"; do
    if [ -L "/etc/nginx/sites-enabled/$config" ] || [ -L "/etc/nginx/sites-enabled/${config}.conf" ]; then
        echo "  🗑️ Удаляю симлинк $config"
        sudo rm -f "/etc/nginx/sites-enabled/$config" "/etc/nginx/sites-enabled/${config}.conf"
        ((REMOVED++))
    fi
done

# Удаляем дубли с цифрами
echo ""
echo "📋 Удаление дублей с цифрами:"
DUPES=$(find /etc/nginx/sites-enabled/ -name "*-[0-9][0-9][0-9][0-9]" 2>/dev/null)
if [ ! -z "$DUPES" ]; then
    echo "$DUPES" | while read dupe; do
        echo "  🗑️ Удаляю дубль $(basename $dupe)"
        sudo rm -f "$dupe"
        ((REMOVED++))
    done
fi

# Удаляем статические страницы
echo ""
echo "📋 Удаление статических страниц:"
if [ -d "/var/www/back/nginx-simple-pages" ]; then
    echo "  🗑️ Удаляю /var/www/back/nginx-simple-pages"
    sudo rm -rf "/var/www/back/nginx-simple-pages"
    ((REMOVED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $REMOVED -eq 0 ]; then
    echo "✅ Неактуальных конфигов не найдено"
else
    echo "✅ Удалено файлов: $REMOVED"
    
    # Проверяем конфигурацию
    echo ""
    echo "📋 Проверка конфигурации nginx:"
    if sudo nginx -t 2>&1 | grep -q "test is successful"; then
        echo "  ✅ Конфигурация валидна"
        
        # Проверяем активные конфиги
        echo ""
        echo "📋 Активные конфиги:"
        ls -la /etc/nginx/sites-enabled/ | grep -E "lumon-frontend|n8n\.psayha\.ru|sb\.psayha\.ru|admin-panel" | awk '{print "  ✅", $9}'
        
        # Перезагружаем nginx
        echo ""
        echo "🔄 Перезагрузка nginx..."
        sudo systemctl reload nginx
        echo "  ✅ Nginx перезагружен"
    else
        echo "  ❌ Ошибка в конфигурации nginx"
        sudo nginx -t
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Рекомендация: запусти проверку"
echo "   bash /var/www/back/verify-nginx-configs.sh"

