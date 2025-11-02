# 🔗 Подключение фронтенда к n8n workflows

## ✅ Что уже готово

- ✅ 5 workflows созданы и импортированы:
  - `create-user` - создание пользователя
  - `create-chat` - создание чата
  - `save-message` - сохранение сообщений
  - `get-chat-history` - получение истории чата
  - `analytics` - отправка аналитики

- ✅ Фронтенд уже использует эти endpoints в `src/utils/api.ts`
- ✅ Конфигурация API в `src/config/api.ts` настроена

## 🔧 Что нужно сделать в n8n

### 1. Активировать все workflows

В n8n интерфейсе:
1. Открой каждый workflow
2. Нажми кнопку **"Active"** (вверху справа) - переключатель должен стать зеленым
3. Повтори для всех 5 workflows

### 2. Настроить PostgreSQL credentials

Для каждого workflow с нодой **PostgreSQL** нужно настроить подключение:

1. Открой workflow (например, "Save Message")
2. Кликни на ноду **PostgreSQL** (Insert Message)
3. Нажми **"Change credential"** или **"Create new credential"**
4. Заполни:
   - **Host:** `supabase-db` (имя контейнера)
   - **Database:** `lumon` (или значение из `.env`: `POSTGRES_DB`)
   - **User:** `postgres` (или значение из `.env`: `POSTGRES_USER`)
   - **Password:** значение из `.env`: `POSTGRES_PASSWORD`
   - **Port:** `5432`
   - **SSL:** можно отключить для внутренней сети
5. Сохрани credential с именем (например, "Lumon Supabase")
6. Повтори для всех workflows:
   - ✅ Save Message - нужны credentials
   - ✅ Get Chat History - нужны credentials
   - ✅ Create Chat - нужны credentials
   - ✅ Create User - нужны credentials
   - ✅ Analytics - нужны credentials

### 3. Проверить URL endpoints

После активации workflows, их URL будут доступны по адресам:

**Production (после настройки SSL):**
- `https://n8n.psayha.ru/webhook/create-user`
- `https://n8n.psayha.ru/webhook/create-chat`
- `https://n8n.psayha.ru/webhook/save-message`
- `https://n8n.psayha.ru/webhook/get-chat-history`
- `https://n8n.psayha.ru/webhook/analytics`

**Development (локально):**
- `http://localhost:5678/webhook/create-user`
- `http://localhost:5678/webhook/create-chat`
- `http://localhost:5678/webhook/save-message`
- `http://localhost:5678/webhook/get-chat-history`
- `http://localhost:5678/webhook/analytics`

## 🧪 Тестирование

### Вариант 1: Через n8n интерфейс

1. Открой workflow (например, "Save Message")
2. Нажми **"Test workflow"** или **"Execute Workflow"**
3. Добавь тестовые данные:
   ```json
   {
     "chat_id": "test-chat-id",
     "role": "user",
     "content": "Test message"
   }
   ```
4. Проверь что все ноды выполнились успешно

### Вариант 2: Через curl (на сервере)

```bash
# Тест создания пользователя
curl -X POST http://localhost:5678/webhook/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 123456789,
    "username": "test_user",
    "first_name": "Test",
    "language_code": "ru"
  }'

# Тест создания чата
curl -X POST http://localhost:5678/webhook/create-chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "ваш-user-id-из-бд"
  }'

# Тест сохранения сообщения
curl -X POST http://localhost:5678/webhook/save-message \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "ваш-chat-id-из-бд",
    "role": "user",
    "content": "Hello, world!"
  }'

# Тест получения истории
curl "http://localhost:5678/webhook/get-chat-history?chat_id=ваш-chat-id-из-бд"

# Тест аналитики
curl -X POST http://localhost:5678/webhook/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "event_data": {"page": "voice-assistant"}
  }'
```

### Вариант 3: Через фронтенд

1. Запусти фронтенд локально: `npm run dev`
2. Открой Voice Assistant страницу
3. Открой DevTools → Network
4. Отправь сообщение в чат
5. Проверь что запросы уходят на правильные endpoints

## 🐛 Возможные проблемы

### 1. "Workflow not active"

**Решение:** Активируй workflow в n8n (переключатель "Active" должен быть зеленым)

### 2. "Database connection failed"

**Решение:** 
- Проверь что PostgreSQL контейнер запущен: `docker ps | grep supabase-db`
- Проверь credentials в ноде PostgreSQL
- Проверь что host указан как `supabase-db` (не `localhost`)

### 3. "404 Not Found"

**Решение:**
- Проверь что workflow активирован
- Проверь путь webhook в ноде (должен быть без `/webhook/` префикса)
- Проверь URL в консоли браузера

### 4. "Invalid query parameter"

**Решение для get-chat-history:**
- Убедись что в n8n workflow используется `$json.query.chat_id` для GET параметров
- Проверь что фронтенд отправляет `?chat_id=...` в URL

## 📝 Checklist

- [ ] Все 5 workflows активированы в n8n
- [ ] PostgreSQL credentials настроены во всех workflows
- [ ] Протестирован каждый endpoint через curl
- [ ] Фронтенд подключен и отправляет запросы
- [ ] Проверены логи n8n на ошибки
- [ ] Проверены логи PostgreSQL контейнера

## 🚀 Следующие шаги

После настройки:
1. Протестируй полный flow: создание пользователя → создание чата → отправка сообщений
2. Проверь что данные сохраняются в БД через Supabase Studio
3. Проверь аналитику через запросы к `analytics_events` таблице

