#!/bin/bash

# Скрипт для тестирования API endpoints с сервера
# Использование: ./test-api-from-server.sh

echo "🧪 Тестирование API endpoints с сервера..."
echo ""

BASE_URL="http://localhost:5678"

echo "1️⃣ Create User:"
curl -X POST "${BASE_URL}/webhook/create-user" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 999999999,
    "username": "test_user",
    "first_name": "Test",
    "last_name": "User",
    "language_code": "ru"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -20

echo ""
echo "2️⃣ Analytics:"
curl -X POST "${BASE_URL}/webhook/analytics" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test",
    "event_data": {"test": true}
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  2>&1 | head -20

echo ""
echo "3️⃣ Проверка через nginx (n8n.psayha.ru):"
curl -X POST "http://n8n.psayha.ru/webhook/analytics" \
  -H "Content-Type: application/json" \
  -H "Origin: https://psayha.ru" \
  -d '{
    "event_type": "test",
    "event_data": {"test": true}
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "(HTTP|Access-Control|Origin)" | head -10

echo ""
echo "✅ Тестирование завершено"

