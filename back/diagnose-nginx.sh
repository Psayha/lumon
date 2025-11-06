#!/bin/bash

# Диагностика проблем с Nginx
# Выполни: sudo bash diagnose-nginx.sh

echo "🔍 Диагностика Nginx..."
echo ""

# Проверка статуса
echo "📋 Статус Nginx:"
systemctl status nginx --no-pager -l | head -10

# Проверка конфигурации
echo ""
echo "📋 Тест конфигурации:"
nginx -t

# Активные конфиги
echo ""
echo "📋 Активные конфиги в sites-enabled:"
ls -la /etc/nginx/sites-enabled/

# Проверка на дубли server_name
echo ""
echo "📋 Проверка на дубли server_name:"
grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "#"

# Последние ошибки
echo ""
echo "📋 Последние ошибки Nginx:"
tail -20 /var/log/nginx/error.log

echo ""
echo "✅ Диагностика завершена"

