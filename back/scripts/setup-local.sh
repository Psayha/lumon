#!/bin/bash

# Lumon Backend - Local Setup Script
# Настройка локальной среды разработки для n8n + Supabase

set -e

echo "🚀 Настройка Lumon Backend (n8n + Supabase)"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Создание .env файла если его нет
if [ ! -f .env ]; then
    echo "📝 Создание .env файла..."
    cp .env.example .env
    echo "✅ Файл .env создан. Отредактируйте его при необходимости."
fi

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p n8n/workflows
mkdir -p ../base/supabase/migrations

echo "✅ Директории созданы"

# Запуск Docker Compose
echo "🐳 Запуск Docker Compose..."
docker-compose up -d

echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверка статуса
echo "📊 Статус сервисов:"
docker-compose ps

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   - Supabase Studio: http://localhost:3001"
echo "   - n8n: http://localhost:5678"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Откройте Supabase Studio: http://localhost:3001"
echo "   2. Откройте n8n: http://localhost:5678"
echo "   3. Начните создавать workflows в n8n"
echo ""
echo "Для остановки: docker-compose down"
echo "Для просмотра логов: docker-compose logs -f"

