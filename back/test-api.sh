#!/bin/bash

# Скрипт для тестирования API endpoints
# Использование: bash test-api.sh [BASE_URL]
# Пример: bash test-api.sh http://91.229.10.47:5678

BASE_URL="${1:-http://localhost:5678}"

echo "🧪 Тестирование API endpoints..."
echo "Base URL: $BASE_URL"
echo ""

# Тест 1: Create User
echo "1. Тест создания пользователя..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/create-user" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 999999999,
    "username": "test_user",
    "first_name": "Test",
    "last_name": "User",
    "language_code": "ru",
    "is_premium": false
  }')

echo "   Ответ: $USER_RESPONSE"

if echo "$USER_RESPONSE" | grep -q "success"; then
    echo "   ✅ Пользователь создан"
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "   User ID: $USER_ID"
else
    echo "   ❌ Ошибка создания пользователя"
    echo "   Полный ответ: $USER_RESPONSE"
    exit 1
fi

echo ""

# Тест 2: Create Chat
echo "2. Тест создания чата..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/create-chat" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}")

echo "   Ответ: $CHAT_RESPONSE"

if echo "$CHAT_RESPONSE" | grep -q "success"; then
    echo "   ✅ Чат создан"
    CHAT_ID=$(echo "$CHAT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "   Chat ID: $CHAT_ID"
else
    echo "   ❌ Ошибка создания чата"
    echo "   Полный ответ: $CHAT_RESPONSE"
    exit 1
fi

echo ""

# Тест 3: Save Message
echo "3. Тест сохранения сообщения..."
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/save-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"$CHAT_ID\",
    \"role\": \"user\",
    \"content\": \"Тестовое сообщение\"
  }")

echo "   Ответ: $MESSAGE_RESPONSE"

if echo "$MESSAGE_RESPONSE" | grep -q "success"; then
    echo "   ✅ Сообщение сохранено"
else
    echo "   ❌ Ошибка сохранения сообщения"
    echo "   Полный ответ: $MESSAGE_RESPONSE"
    exit 1
fi

echo ""

# Тест 4: Get Chat History
echo "4. Тест получения истории..."
HISTORY_RESPONSE=$(curl -s "$BASE_URL/webhook/get-chat-history?chat_id=$CHAT_ID")

echo "   Ответ: $HISTORY_RESPONSE"

if echo "$HISTORY_RESPONSE" | grep -q "success"; then
    echo "   ✅ История получена"
else
    echo "   ❌ Ошибка получения истории"
    echo "   Полный ответ: $HISTORY_RESPONSE"
    exit 1
fi

echo ""

# Тест 5: Analytics
echo "5. Тест аналитики..."
ANALYTICS_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/analytics" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "event_data": {"test": true}
  }')

echo "   Ответ: $ANALYTICS_RESPONSE"

if echo "$ANALYTICS_RESPONSE" | grep -q "success"; then
    echo "   ✅ Аналитика работает"
else
    echo "   ⚠️  Аналитика не вернула success"
fi

echo ""
echo "✅ Все тесты выполнены!"

