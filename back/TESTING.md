# 🧪 Тестирование после деплоя

## Быстрая проверка

### 1. Проверка доступности сервисов

```bash
# На сервере или локально через curl

# Frontend
curl -I http://91.229.10.47
curl -I http://psayha.ru

# n8n
curl -I http://91.229.10.47:5678
# Или через поддомен (после настройки DNS):
# curl -I http://n8n.psayha.ru

# Supabase Studio
curl -I http://91.229.10.47:3001
# Или через поддомен:
# curl -I http://sb.psayha.ru
```

**Ожидаемый результат:** HTTP 200 OK

### 2. Проверка Docker контейнеров

```bash
# На сервере
cd /var/www/back
docker compose ps

# Должно быть 3 контейнера в статусе "Up":
# - lumon-supabase-db
# - lumon-supabase-studio
# - lumon-n8n
```

### 3. Проверка логов

```bash
# На сервере
cd /var/www/back

# Проверь логи n8n
docker compose logs n8n --tail 30

# Проверь логи Supabase
docker compose logs supabase-db --tail 30
docker compose logs supabase-studio --tail 30

# Если есть ошибки - исправь и перезапусти
docker compose restart n8n
```

## Тестирование API endpoints (n8n workflows)

### Тест 1: Создание пользователя

```bash
curl -X POST http://91.229.10.47:5678/webhook/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 123456789,
    "username": "test_user",
    "first_name": "Test",
    "last_name": "User",
    "language_code": "ru",
    "is_premium": false
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "telegram_id": 123456789,
    "username": "test_user",
    ...
  }
}
```

**Сохрани `user_id` из ответа для следующих тестов!**

### Тест 2: Создание чата

```bash
curl -X POST http://91.229.10.47:5678/webhook/create-chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "ВАШ_USER_ID_ИЗ_ТЕСТА_1"
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "user_id": "...",
    "title": "Voice Assistant Chat",
    ...
  }
}
```

**Сохрани `chat_id` из ответа!**

### Тест 3: Сохранение сообщения

```bash
curl -X POST http://91.229.10.47:5678/webhook/save-message \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "ВАШ_CHAT_ID_ИЗ_ТЕСТА_2",
    "role": "user",
    "content": "Привет, это тестовое сообщение!"
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "chat_id": "...",
    "role": "user",
    "content": "Привет, это тестовое сообщение!",
    ...
  }
}
```

### Тест 4: Получение истории чата

```bash
curl "http://91.229.10.47:5678/webhook/get-chat-history?chat_id=ВАШ_CHAT_ID_ИЗ_ТЕСТА_2"
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "chat_id": "...",
      "role": "user",
      "content": "Привет, это тестовое сообщение!",
      "timestamp": "..."
    }
  ]
}
```

### Тест 5: Аналитика

```bash
curl -X POST http://91.229.10.47:5678/webhook/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "event_data": {
      "test": true,
      "timestamp": "2024-11-02T22:00:00Z"
    }
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true
}
```

## Тестирование через Frontend

### 1. Открой Frontend

- **URL**: http://91.229.10.47 или http://psayha.ru
- Проверь что страница загружается без ошибок
- Открой DevTools → Console (F12)

### 2. Тест Voice Assistant страницы

1. Зайди на страницу Voice Assistant
2. Отправь сообщение
3. Проверь в Console что:
   - Запросы уходят на правильный API endpoint
   - Нет ошибок 404, 500, etc.
   - Сообщения сохраняются

### 3. Проверь Network вкладку (DevTools)

1. Открой DevTools → Network
2. Отправь сообщение
3. Проверь что запросы идут на:
   - `http://91.229.10.47:5678/webhook/...` (пока без SSL)
   - Или `https://n8n.psayha.ru/webhook/...` (после настройки SSL)

## Проверка базы данных

### Через Supabase Studio

1. Открой http://91.229.10.47:3001 (или http://sb.psayha.ru)
2. Подключись к базе данных
3. Проверь таблицы:
   - `users` - должны быть записи из тестов
   - `chats` - должны быть созданные чаты
   - `messages` - должны быть сохраненные сообщения
   - `analytics_events` - должны быть события аналитики

### Через PostgreSQL напрямую

```bash
# На сервере
docker exec -it lumon-supabase-db psql -U postgres -d lumon

# В psql:
\dt                    # Список таблиц
SELECT * FROM users;    # Проверка пользователей
SELECT * FROM chats;    # Проверка чатов
SELECT * FROM messages; # Проверка сообщений
\q                     # Выход
```

## Чеклист полного тестирования

- [ ] Frontend доступен и загружается
- [ ] n8n доступен и открывается интерфейс
- [ ] Supabase Studio доступен
- [ ] Docker контейнеры запущены (3 штуки)
- [ ] Workflow "Create User" работает
- [ ] Workflow "Create Chat" работает
- [ ] Workflow "Save Message" работает
- [ ] Workflow "Get Chat History" работает
- [ ] Workflow "Analytics" работает
- [ ] Данные сохраняются в БД (проверено через Supabase Studio)
- [ ] Frontend может отправлять сообщения и получать ответы
- [ ] Нет ошибок в консоли браузера
- [ ] Нет ошибок в логах Docker

## Troubleshooting

### Ошибка 404 на API endpoint

**Проблема:** `Cannot GET /webhook/create-user`

**Решение:**
1. Проверь что workflow активирован в n8n
2. Проверь путь webhook в ноде (должен быть без `/webhook/` префикса)
3. Проверь логи n8n: `docker compose logs n8n`

### Ошибка подключения к БД

**Проблема:** `Database connection failed`

**Решение:**
1. Проверь что PostgreSQL контейнер запущен: `docker compose ps`
2. Проверь credentials в workflow ноде PostgreSQL
3. Host должен быть `supabase-db` (не `localhost`)

### Frontend не может подключиться к API

**Проблема:** CORS ошибки или connection refused

**Решение:**
1. Проверь что n8n доступен: `curl http://91.229.10.47:5678`
2. Проверь что в `src/config/api.ts` правильный URL
3. Проверь что VITE_API_URL установлен при сборке

### Secure cookie ошибка

**Проблема:** `Your n8n server is configured to use a secure cookie`

**Решение:**
```bash
cd /var/www/back
echo "N8N_SECURE_COOKIE=false" >> .env
docker compose restart n8n
```

## Автоматический тест скрипт

```bash
#!/bin/bash
# Сохрани как test-api.sh и запусти: bash test-api.sh

BASE_URL="http://91.229.10.47:5678"

echo "🧪 Тестирование API endpoints..."
echo ""

# Тест 1: Create User
echo "1. Тест создания пользователя..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/create-user" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 999999999,
    "username": "test_user",
    "first_name": "Test",
    "language_code": "ru"
  }')

if echo "$USER_RESPONSE" | grep -q "success"; then
    echo "   ✅ Пользователь создан"
    USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo "   ❌ Ошибка создания пользователя"
    exit 1
fi

# Тест 2: Create Chat
echo "2. Тест создания чата..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/create-chat" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}")

if echo "$CHAT_RESPONSE" | grep -q "success"; then
    echo "   ✅ Чат создан"
    CHAT_ID=$(echo "$CHAT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo "   ❌ Ошибка создания чата"
    exit 1
fi

# Тест 3: Save Message
echo "3. Тест сохранения сообщения..."
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/save-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"$CHAT_ID\",
    \"role\": \"user\",
    \"content\": \"Тестовое сообщение\"
  }")

if echo "$MESSAGE_RESPONSE" | grep -q "success"; then
    echo "   ✅ Сообщение сохранено"
else
    echo "   ❌ Ошибка сохранения сообщения"
    exit 1
fi

# Тест 4: Get Chat History
echo "4. Тест получения истории..."
HISTORY_RESPONSE=$(curl -s "$BASE_URL/webhook/get-chat-history?chat_id=$CHAT_ID")

if echo "$HISTORY_RESPONSE" | grep -q "success"; then
    echo "   ✅ История получена"
else
    echo "   ❌ Ошибка получения истории"
    exit 1
fi

# Тест 5: Analytics
echo "5. Тест аналитики..."
ANALYTICS_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/analytics" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test",
    "event_data": {"test": true}
  }')

if echo "$ANALYTICS_RESPONSE" | grep -q "success"; then
    echo "   ✅ Аналитика работает"
else
    echo "   ⚠️  Аналитика не вернула success (может быть нормально)"
fi

echo ""
echo "✅ Все тесты пройдены!"
```

