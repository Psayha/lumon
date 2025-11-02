# 📥 Импорт n8n Workflows

## 🚀 Быстрый импорт всех workflows

Все workflows созданы и готовы к импорту. Выполните следующие шаги:

### Шаг 1: Откройте n8n

1. Откройте http://localhost:5678
2. Войдите:
   - Пользователь: `admin`
   - Пароль: `lumon_dev`

### Шаг 2: Настройте PostgreSQL Credential (один раз)

Перед импортом workflows нужно настроить подключение к PostgreSQL:

1. Перейдите в **Settings** → **Credentials**
2. Нажмите **New Credential**
3. Выберите **PostgreSQL**
4. Заполните:
   - **Name:** `Lumon PostgreSQL`
   - **Host:** `supabase-db` (если в Docker) или `localhost` (если вне Docker)
   - **Port:** `5432`
   - **Database:** `lumon`
   - **User:** `postgres`
   - **Password:** `lumon_dev_password`
   - **SSL:** `false` (для локальной разработки)
5. Нажмите **Save**

### Шаг 3: Импортируйте workflows

Для каждого workflow:

1. В n8n перейдите в **Workflows**
2. Нажмите **Import from File** или **Import from URL**
3. Выберите файл из `back/n8n/workflows/`:
   - `save-message.json`
   - `get-chat-history.json`
   - `create-user.json`
   - `create-chat.json`
   - `analytics.json`

4. После импорта откройте каждый workflow и:
   - В каждом **PostgreSQL node** выберите credential `Lumon PostgreSQL`
   - Проверьте, что все nodes подключены правильно

### Шаг 4: Активируйте workflows

После импорта и настройки credentials:

1. Откройте каждый workflow
2. Переключите **Active** в положение **ON** (вверху справа)
3. Убедитесь, что workflows работают (проверьте в Executions)

## 📋 Список созданных workflows

### 1. Save Message
- **Endpoint:** `POST /webhook/save-message`
- **Файл:** `save-message.json`
- **Функция:** Сохранение сообщений в таблицу `messages`

### 2. Get Chat History
- **Endpoint:** `GET /webhook/get-chat-history?chat_id=xxx`
- **Файл:** `get-chat-history.json`
- **Функция:** Получение истории сообщений чата

### 3. Create User
- **Endpoint:** `POST /webhook/create-user`
- **Файл:** `create-user.json`
- **Функция:** Создание или обновление пользователя в таблице `users`

### 4. Create Chat
- **Endpoint:** `POST /webhook/create-chat`
- **Файл:** `create-chat.json`
- **Функция:** Создание нового чата в таблице `chats`

### 5. Analytics
- **Endpoint:** `POST /webhook/analytics`
- **Файл:** `analytics.json`
- **Функция:** Сохранение аналитических событий в таблицу `analytics_events`

## 🔧 Обновление Credentials в импортированных workflows

После импорта workflows нужно обновить PostgreSQL credentials:

1. Откройте каждый workflow
2. Найдите все **PostgreSQL** nodes
3. В каждом node:
   - Нажмите на credential dropdown
   - Выберите или создайте `Lumon PostgreSQL`
   - Сохраните изменения

## ✅ Проверка работы

После импорта и активации протестируйте каждый workflow:

```bash
# Тест Save Message
curl -X POST http://localhost:5678/webhook/save-message \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "00000000-0000-0000-0000-000000000000", "role": "user", "content": "Test message"}'

# Тест Get Chat History
curl "http://localhost:5678/webhook/get-chat-history?chat_id=00000000-0000-0000-0000-000000000000"

# Тест Create User
curl -X POST http://localhost:5678/webhook/create-user \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 123456789, "first_name": "Test", "username": "testuser"}'

# Тест Create Chat
curl -X POST http://localhost:5678/webhook/create-chat \
  -H "Content-Type: application/json" \
  -d '{"user_id": "00000000-0000-0000-0000-000000000000", "title": "Test Chat"}'

# Тест Analytics
curl -X POST http://localhost:5678/webhook/analytics \
  -H "Content-Type: application/json" \
  -d '{"event_type": "test_event", "event_data": {"test": "data"}}'
```

## 📝 Примечания

- Все workflows используют один credential: `Lumon PostgreSQL`
- После импорта убедитесь, что все credentials настроены
- Workflows автоматически обрабатывают ошибки и возвращают правильные ответы
- Все workflows готовы к визуальному редактированию после импорта

## 🐛 Troubleshooting

### Проблема: Credential не найден после импорта

**Решение:**
1. Создайте credential `Lumon PostgreSQL` вручную (см. Шаг 2)
2. В каждом PostgreSQL node выберите этот credential
3. Сохраните workflow

### Проблема: Workflow не активируется

**Решение:**
1. Проверьте, что все nodes подключены (нет разрывов в connections)
2. Убедитесь, что все credentials настроены
3. Проверьте логи: **Executions** → выберите failed execution → смотрите ошибки

### Проблема: Ошибка подключения к PostgreSQL

**Решение:**
- Проверьте, что контейнер `supabase-db` запущен: `docker-compose ps`
- Проверьте host в credential: `supabase-db` (для Docker) или `localhost` (вне Docker)
- Проверьте пароль в `.env` файле

