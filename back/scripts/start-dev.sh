#!/bin/bash

# Lumon Backend - Start Development Script
# Запуск локальной среды разработки

set -e

echo "🚀 Запуск Lumon Backend (n8n + Supabase)"

# Проверка .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Запустите сначала setup-local.sh"
    exit 1
fi

# Запуск Docker Compose
docker-compose up -d

echo "⏳ Ожидание запуска сервисов..."
sleep 5

echo "✅ Сервисы запущены!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   - Supabase Studio: http://localhost:3001"
echo "   - n8n: http://localhost:5678"
echo ""
echo "Для остановки: docker-compose down"
echo "Для просмотра логов: docker-compose logs -f"

