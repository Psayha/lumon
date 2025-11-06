#!/bin/bash

# Скрипт для проверки автообновления SSL сертификатов
# Выполни на сервере: sudo bash check-certbot-renewal.sh

echo "🔒 Проверка Certbot автообновления..."
echo ""

# Проверка наличия certbot
echo "📋 Проверка установки Certbot:"
if command -v certbot &> /dev/null; then
    echo "  ✅ Certbot установлен"
    certbot --version
else
    echo "  ❌ Certbot не установлен"
    exit 1
fi

echo ""

# Проверка таймера systemd
echo "📋 Проверка systemd таймера:"
if systemctl list-timers | grep -q certbot; then
    echo "  ✅ Таймер certbot активен"
    systemctl list-timers | grep certbot
else
    echo "  ⚠️ Таймер certbot не найден"
fi

echo ""

# Проверка cron
echo "📋 Проверка cron задач:"
if crontab -l 2>/dev/null | grep -q certbot; then
    echo "  ✅ Cron задача certbot найдена"
    crontab -l | grep certbot
else
    echo "  ⚠️ Cron задача certbot не найдена"
fi

echo ""

# Сухой прогон обновления
echo "📋 Тест обновления сертификатов (dry-run):"
certbot renew --dry-run

echo ""

# Проверка сроков действия сертификатов
echo "📋 Сроки действия сертификатов:"
for domain in n8n.psayha.ru sb.psayha.ru admin.psayha.ru psayha.ru; do
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$domain/fullchain.pem | cut -d= -f2)
        DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            echo "  ✅ $domain: истекает через $DAYS_LEFT дней ($EXPIRY)"
        elif [ $DAYS_LEFT -gt 7 ]; then
            echo "  ⚠️ $domain: истекает через $DAYS_LEFT дней ($EXPIRY)"
        else
            echo "  ❌ $domain: истекает через $DAYS_LEFT дней ($EXPIRY) - ТРЕБУЕТСЯ ОБНОВЛЕНИЕ!"
        fi
    else
        echo "  ❌ $domain: сертификат не найден"
    fi
done

echo ""
echo "✅ Проверка завершена"

