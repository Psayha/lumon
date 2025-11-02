# 🔗 Интеграция n8n с Frontend

## 📋 Обзор интеграции

Frontend отправляет HTTP запросы на n8n webhooks, которые обрабатывают данные и сохраняют их в PostgreSQL через Supabase.

```
Frontend (VoiceAssistantPage.tsx)
    ↓ HTTP POST/GET
n8n Workflows (Webhooks)
    ↓ SQL Queries
PostgreSQL (Supabase)
```

## 🎯 Создание n8n Workflows

### Шаг 1: Открыть n8n

1. Откройте http://localhost:5678
2. Войдите:
   - Пользователь: `admin`
   - Пароль: `lumon_dev`

### Шаг 2: Создать Workflow #1 - Save Message

**Endpoint:** `POST /webhook/save-message`

#### Структура workflow:

```
1. Webhook Trigger
   - Method: POST
   - Path: save-message
   - Response Mode: Respond to Webhook

2. Code (Валидация данных)
   - Проверка обязательных полей
   - Форматирование данных

3. PostgreSQL (Insert Message)
   - Operation: Insert
   - Table: messages
   - Fields:
     * chat_id (UUID)
     * role (user | assistant | system)
     * content (TEXT)
     * timestamp (NOW())

4. Respond to Webhook
   - Status Code: 200
   - Response Body: { success: true, data: {...} }
```

#### Детальные настройки:

**Webhook Trigger:**
- HTTP Method: `POST`
- Path: `save-message`
- Response Mode: `Respond to Webhook`
- Response Code: `200`
- Response Headers: `Content-Type: application/json`

**Code Node (Валидация):**
```javascript
// Получаем данные из webhook
const body = $input.item.json;

// Валидация
if (!body.chat_id || !body.role || !body.content) {
  return {
    json: {
      success: false,
      error: 'Missing required fields: chat_id, role, content'
    }
  };
}

// Форматирование данных для PostgreSQL
return {
  json: {
    chat_id: body.chat_id,
    role: body.role,
    content: body.content,
    timestamp: new Date().toISOString()
  }
};
```

**PostgreSQL Node:**
- Credentials: Создайте connection к PostgreSQL
  - Host: `supabase-db` (или `localhost` если вне Docker)
  - Port: `5432`
  - Database: `lumon`
  - User: `postgres`
  - Password: `lumon_dev_password`
- Operation: `Insert`
- Table: `messages`
- Columns: `chat_id`, `role`, `content`, `timestamp`

**Respond to Webhook:**
```javascript
const dbResult = $input.item.json;

return {
  json: {
    success: true,
    data: {
      id: dbResult.id,
      chat_id: dbResult.chat_id,
      role: dbResult.role,
      content: dbResult.content,
      created_at: dbResult.created_at
    }
  }
};
```

### Шаг 3: Создать Workflow #2 - Get Chat History

**Endpoint:** `GET /webhook/get-chat-history?chat_id=xxx`

#### Структура workflow:

```
1. Webhook Trigger
   - Method: GET
   - Path: get-chat-history
   - Query Parameters: chat_id

2. PostgreSQL (Select Messages)
   - Operation: Execute Query
   - Query: SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC

3. Code (Форматирование ответа)
   - Преобразование данных для frontend

4. Respond to Webhook
   - Status Code: 200
   - Response Body: { success: true, data: [...] }
```

#### Детальные настройки:

**Webhook Trigger:**
- HTTP Method: `GET`
- Path: `get-chat-history`
- Query Parameters: `chat_id`

**PostgreSQL Node:**
- Operation: `Execute Query`
- Query:
```sql
SELECT 
  id,
  chat_id,
  role,
  content,
  created_at
FROM messages 
WHERE chat_id = $1::uuid
ORDER BY created_at ASC
LIMIT 100
```
- Additional Fields: `chat_id` (из query параметров)

**Code Node (Форматирование):**
```javascript
const messages = $input.item.json;

return {
  json: {
    success: true,
    data: messages.map(msg => ({
      id: msg.id,
      chat_id: msg.chat_id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at
    }))
  }
};
```

### Шаг 4: Создать Workflow #3 - Create User

**Endpoint:** `POST /webhook/create-user`

#### Структура workflow:

```
1. Webhook Trigger
   - Method: POST
   - Path: create-user

2. Code (Проверка существования)
   - Проверка по telegram_id

3. PostgreSQL (Select User)
   - Operation: Execute Query
   - Проверка: SELECT id FROM users WHERE telegram_id = $1

4. IF Node (Существует?)
   - Условие: id exists?
   - Если ДА → Update User
   - Если НЕТ → Insert User

5. PostgreSQL (Insert/Update)
   - Operation: Insert или Update

6. Respond to Webhook
```

#### Детальные настройки:

**Code Node (Проверка):**
```javascript
const body = $input.item.json;

if (!body.telegram_id) {
  return {
    json: {
      success: false,
      error: 'telegram_id is required'
    }
  };
}

return { json: body };
```

**PostgreSQL (Check):**
- Operation: `Execute Query`
- Query:
```sql
SELECT id FROM users WHERE telegram_id = $1::bigint
```
- Parameters: `telegram_id` (из body)

**IF Node:**
- Condition: `{{ $json.id }} exists`
- True Path → Update
- False Path → Insert

**PostgreSQL (Insert):**
- Operation: `Insert`
- Table: `users`
- Columns:
  - `telegram_id`
  - `username`
  - `first_name`
  - `last_name`
  - `language_code`
  - `is_premium`

**PostgreSQL (Update):**
- Operation: `Update`
- Table: `users`
- Update Key: `id`
- Fields: `username`, `first_name`, `last_name`, `language_code`, `is_premium`

### Шаг 5: Создать Workflow #4 - Create Chat

**Endpoint:** `POST /webhook/create-chat`

#### Структура workflow:

```
1. Webhook Trigger
   - Method: POST
   - Path: create-chat

2. Code (Валидация)
   - Проверка user_id

3. PostgreSQL (Insert Chat)
   - Operation: Insert
   - Table: chats
   - Fields: user_id, title, expires_at

4. Respond to Webhook
```

**PostgreSQL (Insert Chat):**
- Operation: `Insert`
- Table: `chats`
- Columns:
  - `user_id` (UUID)
  - `title` (TEXT, optional)
  - `expires_at` (TIMESTAMP, DEFAULT: NOW() + 14 days)

### Шаг 6: Создать Workflow #5 - Analytics

**Endpoint:** `POST /webhook/analytics`

#### Структура workflow:

```
1. Webhook Trigger
   - Method: POST
   - Path: analytics

2. Code (Валидация)
   - Проверка event_type

3. PostgreSQL (Insert Event)
   - Operation: Insert
   - Table: analytics_events
   - Fields: user_id, event_type, event_data

4. Respond to Webhook
```

**PostgreSQL (Insert Event):**
- Operation: `Insert`
- Table: `analytics_events`
- Columns:
  - `user_id` (UUID, optional)
  - `event_type` (TEXT)
  - `event_data` (JSONB)

## 🔧 Настройка PostgreSQL Connection в n8n

1. Откройте n8n Settings → Credentials
2. Создайте новую PostgreSQL credential:
   - Name: `Lumon PostgreSQL`
   - Host: `supabase-db` (или `localhost`)
   - Port: `5432`
   - Database: `lumon`
   - User: `postgres`
   - Password: `lumon_dev_password`
   - SSL: `false` (для локальной разработки)

## 🧪 Тестирование Workflows

### Тест через cURL:

```bash
# Test Save Message
curl -X POST http://localhost:5678/webhook/save-message \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "test-chat-id",
    "role": "user",
    "content": "Hello, AI!"
  }'

# Test Get Chat History
curl "http://localhost:5678/webhook/get-chat-history?chat_id=test-chat-id"

# Test Create User
curl -X POST http://localhost:5678/webhook/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 123456789,
    "first_name": "Test",
    "username": "testuser"
  }'
```

## 📊 Мониторинг

1. **n8n Executions:** http://localhost:5678/executions
2. **PostgreSQL (Supabase Studio):** http://localhost:3001
3. **Логи n8n:**
   ```bash
   docker-compose logs -f n8n
   ```

## 🚨 Troubleshooting

### Проблема: Webhook не доступен из frontend

**Решение:**
- Проверьте, что workflow активирован (Active = ON)
- Проверьте URL в frontend (должен быть `http://localhost:5678/webhook/...`)
- Проверьте CORS настройки n8n (если нужно)

### Проблема: PostgreSQL connection failed

**Решение:**
- Проверьте, что контейнер `supabase-db` запущен: `docker-compose ps`
- Проверьте credentials в n8n
- Для Docker используйте `supabase-db`, для локального - `localhost`

### Проблема: Данные не сохраняются

**Решение:**
- Проверьте логи n8n: `docker-compose logs n8n`
- Проверьте структуру запроса в Code Node
- Убедитесь, что таблицы созданы (миграции применены)

## ✅ Checklist интеграции

- [ ] Создан workflow "Save Message"
- [ ] Создан workflow "Get Chat History"
- [ ] Создан workflow "Create User"
- [ ] Создан workflow "Create Chat"
- [ ] Создан workflow "Analytics"
- [ ] Все workflows активированы (Active = ON)
- [ ] PostgreSQL credentials настроены
- [ ] Протестированы все endpoints через cURL
- [ ] Frontend успешно отправляет запросы
- [ ] Данные сохраняются в PostgreSQL

## 📝 Следующие шаги

После создания всех workflows:

1. Экспортируйте workflows в `back/n8n/workflows/` (для версионирования)
2. Протестируйте полный цикл: Frontend → n8n → PostgreSQL
3. Настройте обработку ошибок и логирование
4. Добавьте валидацию данных на стороне n8n

