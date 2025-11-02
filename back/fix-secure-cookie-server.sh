#!/bin/bash

# Скрипт для исправления N8N_SECURE_COOKIE на сервере
# Выполни: cd /var/www/back && bash fix-secure-cookie-server.sh

echo "🔧 Исправление N8N_SECURE_COOKIE..."

# Добавляем переменную в .env
echo "N8N_SECURE_COOKIE=false" >> .env

# Проверяем что добавилось
echo "✅ Проверка .env:"
grep N8N_SECURE_COOKIE .env

# Перезапускаем n8n
echo ""
echo "🔄 Перезапуск n8n контейнера..."
docker compose restart n8n

# Ждем 5 секунд
sleep 5

# Проверяем логи
echo ""
echo "📋 Логи n8n (последние 20 строк):"
docker compose logs n8n --tail 20

echo ""
echo "✅ Готово! Проверь доступность n8n"

