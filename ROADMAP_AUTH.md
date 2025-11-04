# 🔐 План доработок: Авторизация, роли и структура n8n (Ноябрь 2025)

## 🎯 Цель
Сделать поведение системы как у классических приложений с авторизацией: единая сессия, роли/компании, валидация доступа на каждом запросе, единый формат ошибок и предсказуемая структура воркфлоу.

---

## 📋 Проблема (текущее состояние)

**Что есть сейчас:**
- Пользователь заходит через Telegram Mini App
- Запросы проходят напрямую к разным воркфлоу в n8n
- Проверок авторизации нет
- Логика создания пользователя разбросана по разным местам
- Нет понимания роли пользователя (owner/manager)
- Нет привязки к компании
- Нет истории поиска per-user
- Данные не изолированы по компаниям

**Что нужно:**
- При входе: проверить Telegram ID → определить роль → загрузить данные компании
- Если роль owner → показать данные своей компании
- Если роль manager → показать данные своей компании (с ограничениями)
- Загружать историю поиска для конкретного пользователя
- Валидировать каждый запрос через единую точку (как middleware в Express)
- Единая структура ошибок и успешных ответов

---

## 🏗️ Архитектура n8n (структура воркфлоу)

### Общая схема
```
/auth/
  ├── init          # Webhook: принимает Telegram initData → проверяет HMAC → upsert user → создаёт сессию → возвращает session_token + context
  ├── validate      # Subworkflow: проверяет session_token, возвращает context (userId, role, companyId, permissions) или ошибку 401/403
  ├── refresh       # Subworkflow: продлевает сессию при активности (скользящее окно + grace period)
  └── authorize     # Subworkflow: проверяет право на действие (RBAC + владение ресурсом)

/chat/
  ├── create        # Создание чата (только после validate/authorize)
  ├── getHistory    # История чата (валидация доступа к чату/компании)
  └── saveMessage   # Сохранение сообщения (валидация доступа)

/analytics/
  └── logEvent      # Логирование событий (через validate)
```

### Унифицированный паттерн для бизнес-воркфлоу
**Каждый** бизнес-воркфлоу следует этой структуре:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Webhook Node (триггер)                               │
│    - Принимает запрос с заголовком Authorization        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Execute Workflow: auth.validate                      │
│    - Input: { token: $headers.authorization }           │
│    - Output: context { userId, role, companyId }        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 3. IF Node: проверка наличия ошибки                     │
│    - Если error → Response (401/403)                    │
│    - Иначе → продолжить                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Бизнес-логика                                        │
│    - Доступ к context.userId, context.companyId         │
│    - Фильтрация по companyId                            │
│    - Запросы в БД с WHERE company_id = context.companyId│
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Response Node                                        │
│    - Единый формат { success, data, traceId }           │
└─────────────────────────────────────────────────────────┘
```

## 📡 Контракты API

### Заголовки (конвенции)
```http
Authorization: Bearer <session_token>
X-Request-Id: <uuid>              # опционально, для трейсинга
Idempotency-Key: <uuid>           # для mutating-запросов
Content-Type: application/json
```

### Единый формат ошибок
```json
{
  "error": "unauthorized",
  "status": 401,
  "message": "Invalid or expired token",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Коды ошибок:**
- `400` - Bad Request (невалидные данные)
- `401` - Unauthorized (нет токена / просрочен / невалиден)
- `403` - Forbidden (токен валиден, но нет прав на ресурс)
- `404` - Not Found (ресурс не найден)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### Единый формат успеха
```json
{
  "success": true,
  "data": {
    /* payload */
  },
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🔐 Детальное описание воркфлоу

### 1️⃣ `/webhook/auth-init` (POST) - Инициализация сессии

**Назначение:** Первый запрос при старте приложения. Проверяет Telegram initData, создаёт или обновляет пользователя, создаёт сессию.

**Input:**
```json
{
  "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397...",
  "appVersion": "1.0.0"
}
```

**Логика (блок-схема):**
```
┌─────────────────────────────────────────┐
│ 1. Function: Verify Telegram initData  │
│    - Извлечь hash и data                │
│    - HMAC_SHA256 проверка               │
│    - Проверить auth_date (< 5 min)      │
└──────────────┬──────────────────────────┘
               │
               ▼
      ┌────────────────┐
      │ Valid?         │
      └────┬──────┬────┘
           │NO    │YES
           ▼      ▼
      ┌────────┐ ┌────────────────────────┐
      │ Return │ │ 2. Postgres: UPSERT    │
      │ 401    │ │    users by telegram_id│
      └────────┘ └───────────┬────────────┘
                             │
                             ▼
               ┌─────────────────────────────┐
               │ 3. Postgres: SELECT role    │
               │    FROM user_companies      │
               │    WHERE user_id = $1       │
               │    LIMIT 1                  │
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │ 4. Postgres: INSERT session │
               │    - id (uuid)              │
               │    - user_id                │
               │    - expires_at = now()+7d  │
               │    RETURNING id             │
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │ 5. Response: 200            │
               │    { session_token, user,   │
               │      companyId, role }      │
               └─────────────────────────────┘
```

**Output (успех):**
```json
{
  "success": true,
  "data": {
    "session_token": "550e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "telegram_id": 279058397,
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe"
    },
    "companyId": "c0e4567-e89b-12d3-a456-426614174999",
    "role": "owner"
  },
  "traceId": "..."
}
```

**n8n ноды (пример конфигурации):**
```
1. Webhook Trigger
   - Path: /webhook/auth-init
   - Method: POST
   
2. Function: Verify Telegram initData
   - Code: (см. секцию "Проверка Telegram initData")
   
3. Postgres: Upsert User
   - Query: 
     INSERT INTO users (telegram_id, username, first_name, last_name, language_code)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (telegram_id) 
     DO UPDATE SET username = $2, first_name = $3, last_name = $4, updated_at = now()
     RETURNING id, telegram_id, username, first_name, last_name
   
4. Postgres: Get User Company & Role
   - Query:
     SELECT uc.company_id, uc.role, c.name as company_name
     FROM user_companies uc
     JOIN companies c ON c.id = uc.company_id
     WHERE uc.user_id = $1
     LIMIT 1
   
5. Postgres: Create Session
   - Query:
     INSERT INTO sessions (user_id, expires_at, user_agent, ip)
     VALUES ($1, now() + interval '7 days', $2, $3)
     RETURNING id, expires_at
   
6. Function: Format Response
   - Code: return { success: true, data: { ... }, traceId: uuidv4() }
   
7. Response Node
```

---

### 2️⃣ Subworkflow: `auth.validate` - Валидация токена

**Назначение:** Проверяет session_token, возвращает context пользователя. Вызывается в **каждом** бизнес-воркфлоу.

**Input:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Логика:**
```
┌─────────────────────────────────────────┐
│ 1. Postgres: SELECT session             │
│    WHERE id = $token AND                │
│          expires_at > now()             │
└──────────────┬──────────────────────────┘
               │
               ▼
      ┌────────────────┐
      │ Found?         │
      └────┬──────┬────┘
           │NO    │YES
           ▼      ▼
      ┌────────┐ ┌────────────────────────┐
      │ Return │ │ 2. UPDATE last_seen_at │
      │ Error  │ │    = now()             │
      │ 401    │ │    WHERE id = $token   │
      └────────┘ └───────────┬────────────┘
                             │
                             ▼
               ┌─────────────────────────────┐
               │ 3. IF expires_at - now()    │
               │    < 5 minutes (grace)?     │
               └──────────────┬──────────────┘
                              │
                              ▼
                      ┌───────┴───────┐
                      │YES            │NO
                      ▼               ▼
         ┌────────────────────┐  ┌──────────┐
         │ UPDATE expires_at  │  │ Skip     │
         │ = now() + 7d       │  │          │
         └─────────┬──────────┘  └────┬─────┘
                   │                  │
                   └──────────┬───────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │ 4. Postgres: Get User +     │
               │    Company + Role           │
               │    JOIN user_companies      │
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌─────────────────────────────┐
               │ 5. Return context           │
               │    { userId, role,          │
               │      companyId, permissions}│
               └─────────────────────────────┘
```

**Output (успех):**
```json
{
  "context": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "role": "owner",
    "companyId": "c0e4567-e89b-12d3-a456-426614174999",
    "permissions": ["read", "write", "delete"]
  }
}
```

**Output (ошибка):**
```json
{
  "error": "unauthorized",
  "status": 401,
  "message": "Invalid or expired token",
  "traceId": "..."
}
```

**n8n ноды:**
```
1. Workflow Trigger (субворкфлоу)
   - Input: token

2. Postgres: Check Session
   - Query:
     SELECT s.id, s.user_id, s.expires_at, s.last_seen_at
     FROM sessions s
     WHERE s.id = $1::uuid AND s.expires_at > now()
     LIMIT 1

3. IF: Session Exists?
   - false → Error Response (401)

4. Postgres: Update last_seen_at
   - Query: UPDATE sessions SET last_seen_at = now() WHERE id = $1

5. Function: Check Grace Period & Extend
   - Code:
     const expiresAt = new Date($input.expires_at);
     const now = new Date();
     const diff = (expiresAt - now) / 1000 / 60; // minutes
     return { shouldExtend: diff < 5 };

6. IF: shouldExtend?
   - true → Postgres: UPDATE sessions SET expires_at = now() + interval '7 days' WHERE id = $1

7. Postgres: Get User Context
   - Query:
     SELECT u.id as user_id, uc.role, uc.company_id
     FROM users u
     LEFT JOIN user_companies uc ON uc.user_id = u.id
     WHERE u.id = $1
     LIMIT 1

8. Function: Build Permissions
   - Code:
     const permissions = [];
     if (role === 'owner') permissions = ['read', 'write', 'delete'];
     if (role === 'manager') permissions = ['read', 'write'];
     if (role === 'viewer') permissions = ['read'];
     return { context: { userId, role, companyId, permissions } };

9. Return: context
```

---

### 3️⃣ Subworkflow: `auth.refresh` - Продление сессии

**Назначение:** Явное продление сессии (можно вызывать по таймеру с фронта).

**Input:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Логика:**
```sql
UPDATE sessions 
SET expires_at = now() + interval '7 days',
    last_seen_at = now()
WHERE id = $1::uuid 
  AND expires_at > now()
RETURNING expires_at;
```

**Output:**
```json
{
  "success": true,
  "data": {
    "expires_at": "2025-11-11T10:00:00Z"
  }
}
```

---

### 4️⃣ Subworkflow: `auth.authorize` - Проверка прав на ресурс

**Назначение:** RBAC-шейпер для проверки доступа к конкретному ресурсу.

**Input:**
```json
{
  "context": {
    "userId": "...",
    "role": "manager",
    "companyId": "..."
  },
  "resource": "chat",
  "action": "delete",
  "resourceId": "chat-uuid-123"
}
```

**Логика:**
```
1. IF action === 'delete' && role !== 'owner' → return { allowed: false, error: 403 }
2. IF resource === 'chat':
   - SELECT company_id FROM chats WHERE id = resourceId
   - IF company_id !== context.companyId → return { allowed: false, error: 403 }
3. ELSE return { allowed: true }
```

**Output:**
```json
{
  "allowed": true
}
```

или

```json
{
  "allowed": false,
  "error": "forbidden",
  "status": 403,
  "message": "You don't have permission to delete this resource"
}
```

---

### 5️⃣ `/webhook/auth-logout` (POST) - Выход

**Input:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Логика:**
```sql
DELETE FROM sessions WHERE id = $1::uuid;
```

**Output:**
```json
{
  "success": true
}
```

---

### 6️⃣ `/webhook/auth-switch-company` (POST, опционально) - Смена компании

**Назначение:** Для пользователей, привязанных к нескольким компаниям.

**Input:**
```json
{
  "token": "...",
  "companyId": "new-company-uuid"
}
```

**Логика:**
```
1. auth.validate(token) → context
2. SELECT 1 FROM user_companies WHERE user_id = context.userId AND company_id = $companyId
3. IF not found → error 403
4. UPDATE sessions SET active_company_id = $companyId WHERE id = $token (добавить колонку active_company_id)
5. Return success
```

**Output:**
```json
{
  "success": true,
  "data": {
    "companyId": "new-company-uuid"
  }
}
```

## 🗄️ База данных (детально)

### Схема таблиц

#### `users` - Пользователи
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'ru',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
```

#### `companies` - Компании
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `user_companies` - Связь пользователей и компаний + роли
```sql
CREATE TABLE user_companies (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);
```

#### `sessions` - Сессии пользователей
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip TEXT,
  active_company_id UUID REFERENCES companies(id) ON DELETE SET NULL  -- для switch-company
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Автоудаление просроченных сессий (опционально, можно через cron)
-- CREATE INDEX idx_sessions_expired ON sessions(expires_at) WHERE expires_at < now();
```

#### `chats` - Чаты
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_chats_company ON chats(company_id);
CREATE INDEX idx_chats_created ON chats(created_at DESC);
```

#### `messages` - Сообщения в чатах
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',  -- для хранения токенов, модели и т.д.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

#### `audit_events` - Аудит (опционально, рекомендуется)
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'chat.create', 'message.save', 'auth.login', etc
  resource TEXT,         -- 'chat', 'message', 'user'
  resource_id UUID,
  meta JSONB DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_company ON audit_events(company_id);
CREATE INDEX idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX idx_audit_action ON audit_events(action);
```

#### `idempotency_keys` - Идемпотентность (опционально)
```sql
CREATE TABLE idempotency_keys (
  key UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idempotency_created ON idempotency_keys(created_at);

-- Автоудаление старых ключей (> 24h)
-- DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours';
```

#### `rate_limits` - Rate limiting (опционально)
```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  minute_bucket TIMESTAMPTZ NOT NULL,  -- округлённая до минуты timestamp
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint, minute_bucket)
);

CREATE INDEX idx_rate_limits_bucket ON rate_limits(minute_bucket);
```

### Миграции (порядок создания)

**Файл:** `back/supabase/migrations/YYYYMMDD_auth_system.sql`

```sql
-- 1. users (если ещё нет)
-- 2. companies
-- 3. user_companies
-- 4. sessions (добавить active_company_id если нужно switch-company)
-- 5. chats (если ещё нет)
-- 6. messages (если ещё нет)
-- 7. audit_events (опционально)
-- 8. idempotency_keys (опционально)
-- 9. rate_limits (опционально)
```

## ⏱️ Логика сессий (детально)

### Срок жизни и продление

**Параметры:**
- Начальный срок: `7 дней` (можно настроить)
- Grace window: `5 минут` (если до истечения осталось меньше 5 минут — автопродление)
- Скользящее окно: при каждом запросе обновляем `last_seen_at`

**Поведение:**

1. **При создании сессии (`auth.init`):**
```sql
INSERT INTO sessions (user_id, expires_at, user_agent, ip)
VALUES ($userId, now() + interval '7 days', $userAgent, $ip)
RETURNING id;
```

2. **При валидации (`auth.validate`):**
```javascript
// В Function Node
const session = $input.session; // из БД
const now = new Date();
const expiresAt = new Date(session.expires_at);
const minutesLeft = (expiresAt - now) / 1000 / 60;

// Grace window: если осталось < 5 минут
if (minutesLeft < 5 && minutesLeft > 0) {
  // Автопродление
  await db.query(`
    UPDATE sessions 
    SET expires_at = now() + interval '7 days',
        last_seen_at = now()
    WHERE id = $1
  `, [session.id]);
} else {
  // Просто обновляем last_seen_at
  await db.query(`
    UPDATE sessions 
    SET last_seen_at = now()
    WHERE id = $1
  `, [session.id]);
}
```

3. **Явное продление (`auth.refresh`):**
- Фронтенд может вызывать по таймеру (например, каждые 4 минуты)
- Или внутри `auth.validate` (автоматически)

### Инвалидация сессии

**Причины:**
- Явный logout (`/webhook/auth-logout`)
- Истечение срока (`expires_at < now()`)
- Удаление пользователя (CASCADE)

**Очистка просроченных сессий (опционально):**
```sql
-- Можно запускать через cron в n8n (Schedule Trigger)
DELETE FROM sessions WHERE expires_at < now();
```

---

## 🔒 RBAC/Authorize (детально)

### Роли и права

| Роль      | Права                                | Ограничения                        |
|-----------|--------------------------------------|-------------------------------------|
| `owner`   | read, write, delete                 | Полный доступ к данным компании     |
| `manager` | read, write                         | Нет delete, ограничен на некоторые ресурсы |
| `viewer`  | read                                | Только чтение                       |

### Проверка доступа к ресурсам

**Принцип:** Всегда проверять `resource.company_id == context.companyId` ИЛИ `resource.user_id == context.userId`.

**Примеры:**

#### Чтение истории чата
```sql
-- В воркфлоу chat.getHistory
SELECT m.* 
FROM messages m
JOIN chats c ON c.id = m.chat_id
WHERE c.id = $chatId
  AND (c.company_id = $context.companyId OR c.user_id = $context.userId)
ORDER BY m.created_at DESC;
```

#### Создание чата
```sql
-- В воркфлоу chat.create
INSERT INTO chats (user_id, company_id, title)
VALUES ($context.userId, $context.companyId, $title)
RETURNING *;
```

#### Удаление чата (только owner)
```javascript
// В Function Node внутри chat.delete
if (context.role !== 'owner') {
  return {
    error: 'forbidden',
    status: 403,
    message: 'Only owners can delete chats'
  };
}

// Проверить владение ресурсом
const chat = await db.query(`
  SELECT company_id FROM chats WHERE id = $1
`, [chatId]);

if (chat.company_id !== context.companyId) {
  return { error: 'forbidden', status: 403 };
}

// OK, удаляем
await db.query(`DELETE FROM chats WHERE id = $1`, [chatId]);
```

### Использование `auth.authorize` subworkflow

**Когда использовать:**
- Для сложных проверок (delete, update критичных ресурсов)
- Для централизации логики RBAC

**Пример вызова в бизнес-воркфлоу:**
```
1. Execute Workflow: auth.validate → context
2. Execute Workflow: auth.authorize
   Input: { context, resource: 'chat', action: 'delete', resourceId: $chatId }
3. IF: authorize.allowed === false → Response 403
4. ELSE: продолжить удаление
```

---

## 🛡️ Идемпотентность и Rate Limiting (детально)

### Идемпотентность

**Цель:** Предотвратить дублирование операций при повторных запросах (network retry, user double-click).

**Эндпойнты, требующие идемпотентности:**
- `/webhook/chat.save-message`
- `/webhook/chat.create`
- `/webhook/analytics.log-event`

**Реализация в n8n:**

```
1. Webhook Node → принять `Idempotency-Key` из заголовка
2. Function: Check Idempotency
   Code:
     const key = $headers['idempotency-key'];
     if (!key) { 
       return { skip: true }; // не требуется
     }
     
     const existing = await db.query(`
       SELECT response FROM idempotency_keys WHERE key = $1
     `, [key]);
     
     if (existing) {
       // Вернуть сохранённый ответ
       return { cached: true, response: existing.response };
     }
     
     return { skip: false, key };

3. IF: cached === true → Response (сохранённый ответ)
4. ELSE: продолжить бизнес-логику
5. После успешного выполнения:
   INSERT INTO idempotency_keys (key, user_id, endpoint, response)
   VALUES ($key, $userId, $endpoint, $response);
6. Response
```

**Очистка старых ключей:**
```sql
-- Через Schedule Trigger (раз в час)
DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours';
```

### Rate Limiting

**Цель:** Защита от спама и DDoS.

**Лимиты (примеры):**
- `/webhook/chat.save-message`: 30 запросов/минуту per user
- `/webhook/analytics.log-event`: 100 запросов/минуту per company

**Реализация в n8n:**

```
1. Function: Check Rate Limit
   Code:
     const now = new Date();
     const bucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                             now.getHours(), now.getMinutes(), 0); // округляем до минуты
     
     const result = await db.query(`
       INSERT INTO rate_limits (user_id, endpoint, minute_bucket, count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (user_id, endpoint, minute_bucket)
       DO UPDATE SET count = rate_limits.count + 1
       RETURNING count
     `, [userId, endpoint, bucket]);
     
     const limit = 30; // конфиг
     if (result.count > limit) {
       return { exceeded: true, count: result.count, limit };
     }
     
     return { exceeded: false };

2. IF: exceeded === true → Response 429 (Too Many Requests)
3. ELSE: продолжить
```

**Очистка:**
```sql
-- Раз в час удалять старые bucket'ы
DELETE FROM rate_limits WHERE minute_bucket < now() - interval '1 hour';
```

## 🎨 Изменения на фронтенде (детально)

### 1. Инициализация при старте (`src/main.tsx` или `src/App.tsx`)

**Что делать:**
- Проверить наличие `session_token` в `localStorage`
- Если нет → вызвать `/webhook/auth-init` с Telegram `initData`
- Сохранить `session_token` и `context` (userId, role, companyId)

**Код (пример в `src/App.tsx`):**

```typescript
useEffect(() => {
  const initAuth = async () => {
    const existingToken = localStorage.getItem('session_token');
    
    if (existingToken) {
      // Проверить валидность (опционально, можно просто использовать)
      setSessionToken(existingToken);
      return;
    }

    // Если нет токена и это Telegram Mini App
    if (window.Telegram?.WebApp?.initData) {
      try {
        const response = await fetch('/webhook/auth-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: window.Telegram.WebApp.initData,
            appVersion: '1.0.0'
          })
        });

        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('session_token', data.data.session_token);
          localStorage.setItem('user_context', JSON.stringify({
            userId: data.data.user.id,
            role: data.data.role,
            companyId: data.data.companyId
          }));
          setSessionToken(data.data.session_token);
        }
      } catch (error) {
        console.error('Auth init failed:', error);
        // Показать ошибку или retry
      }
    }
  };

  initAuth();
}, []);
```

### 2. Добавление `Authorization` в API запросы (`src/utils/api.ts`)

**Обновить `getDefaultHeaders()`:**

```typescript
const getDefaultHeaders = (): HeadersInit => {
  const token = localStorage.getItem('session_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Для идемпотентных запросов
const getIdempotentHeaders = (): HeadersInit => {
  const headers = getDefaultHeaders();
  headers['Idempotency-Key'] = crypto.randomUUID();
  return headers;
};
```

### 3. Обработка ошибок 401/403

**В `src/utils/api.ts` добавить перехватчик:**

```typescript
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries = apiConfig.retry
): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    // Обработка 401/403
    if (response.status === 401 || response.status === 403) {
      // Очистить токен
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_context');
      
      // Перезапустить auth-init
      if (window.Telegram?.WebApp?.initData) {
        const authResponse = await fetch('/webhook/auth-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: window.Telegram.WebApp.initData
          })
        });

        const authData = await authResponse.json();
        if (authData.success) {
          localStorage.setItem('session_token', authData.data.session_token);
          // Повторить оригинальный запрос
          return fetchWithRetry(url, options, 0);
        }
      }
      
      throw new Error('Unauthorized');
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

### 4. Автоматическое продление сессии

**Опционально, в `src/App.tsx`:**

```typescript
useEffect(() => {
  // Продлевать сессию каждые 4 минуты
  const intervalId = setInterval(async () => {
    const token = localStorage.getItem('session_token');
    if (token) {
      try {
        await fetch('/webhook/auth-refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
    }
  }, 4 * 60 * 1000); // 4 минуты

  return () => clearInterval(intervalId);
}, []);
```

### 5. Убрать прямое создание пользователя/чата из компонентов

**В `front/VoiceAssistantPage.tsx` — удалить:**

```typescript
// ❌ УДАЛИТЬ
const handleCreateUser = async () => {
  // ... логика создания пользователя
};

// ❌ УДАЛИТЬ
const handleCreateChat = async () => {
  // ... логика создания чата через createUser
};
```

**Оставить только:**

```typescript
// ✅ ОСТАВИТЬ
const handleSendMessage = async (message: string) => {
  if (!currentChatId) {
    // Создать чат через API (уже с валидацией)
    const newChat = await createChat({ title: 'New Chat' });
    setCurrentChatId(newChat.id);
  }

  await saveMessage({
    chatId: currentChatId,
    role: 'user',
    content: message
  });

  // ... остальная логика
};
```

### 6. Гварды навигации

**Пример простого гварда:**

```typescript
// src/components/AuthGuard.tsx
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('session_token');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!token && window.Telegram?.WebApp?.initData) {
      // Вызвать auth-init
      initAuth().then(() => setIsReady(true));
    } else {
      setIsReady(true);
    }
  }, [token]);

  if (!isReady) {
    return <ModernSplashScreen />;
  }

  if (!token) {
    return <TelegramOnlyPage />;
  }

  return <>{children}</>;
};
```

**Использование:**

```typescript
// src/App.tsx
<AuthGuard>
  <Routes>
    <Route path="/menu" element={<MenuPage />} />
    <Route path="/chat" element={<VoiceAssistantPage />} />
  </Routes>
</AuthGuard>
```

## 📅 Миграционный план (пошагово)

### Этап 1: База данных (1-2 дня)

**Задачи:**
- [ ] Создать миграцию `YYYYMMDD_auth_system.sql`
- [ ] Добавить таблицы: `companies`, `user_companies`, `sessions`
- [ ] Обновить таблицы `users` (если нужно), `chats`, `messages`
- [ ] Добавить опциональные таблицы: `audit_events`, `idempotency_keys`, `rate_limits`
- [ ] Добавить индексы для производительности
- [ ] Применить миграцию в Supabase
- [ ] Создать тестовые данные (1-2 компании, несколько пользователей с ролями)

**Файлы:**
- `back/supabase/migrations/YYYYMMDD_auth_system.sql`

**SQL (см. секцию "База данных детально")**

---

### Этап 2: n8n - Auth workflows (2-3 дня)

**Задачи:**
- [ ] Создать subworkflow `auth.validate`
  - Принимает `token`
  - Проверяет сессию
  - Обновляет `last_seen_at`
  - Продлевает `expires_at` (grace window)
  - Возвращает `context` или `error`
- [ ] Создать webhook `/webhook/auth-init`
  - Function Node: Telegram initData validation (HMAC)
  - Postgres: Upsert user
  - Postgres: Get user company & role
  - Postgres: Create session
  - Response: `{ session_token, user, companyId, role }`
- [ ] Создать subworkflow `auth.refresh`
  - Продлевает `expires_at`
- [ ] Создать subworkflow `auth.authorize` (опционально)
  - RBAC проверки
- [ ] Создать webhook `/webhook/auth-logout`
  - DELETE session

**Тестирование:**
- Проверить `auth-init` с реальным Telegram initData
- Проверить `auth.validate` с валидным/невалидным токеном
- Проверить продление сессии

---

### Этап 3: n8n - Обновление существующих workflows (1-2 дня)

**Задачи:**
- [ ] Обновить `/webhook/chat.create`
  - Добавить Execute Workflow: `auth.validate`
  - Добавить IF: проверка на ошибку → Response 401
  - Использовать `context.userId`, `context.companyId` в INSERT
- [ ] Обновить `/webhook/chat.get-history`
  - Добавить `auth.validate`
  - Фильтровать по `companyId` или `userId`
- [ ] Обновить `/webhook/chat.save-message`
  - Добавить `auth.validate`
  - Проверить доступ к чату
  - Добавить идемпотентность (опционально)
- [ ] Обновить `/webhook/analytics.log-event`
  - Добавить `auth.validate`
  - Логировать с `userId`/`companyId`

**Паттерн для каждого воркфлоу:**
```
Webhook → Execute: auth.validate → IF (error) → Response 401/403
                                  → ELSE → бизнес-логика → Response
```

---

### Этап 4: Фронтенд - Интеграция авторизации (1-2 дня)

**Задачи:**
- [ ] Обновить `src/App.tsx`
  - Добавить `initAuth()` при старте
  - Сохранять `session_token` в `localStorage`
- [ ] Обновить `src/utils/api.ts`
  - Добавить `Authorization: Bearer <token>` в `getDefaultHeaders()`
  - Добавить обработку 401/403 → re-auth
  - Добавить `getIdempotentHeaders()` для mutating-запросов
- [ ] Создать `src/components/AuthGuard.tsx`
  - Проверять наличие токена
  - Показывать splash/TelegramOnlyPage при отсутствии
- [ ] Обновить `front/VoiceAssistantPage.tsx`
  - Удалить прямое создание пользователя/чата
  - Использовать только API calls (`createChat`, `saveMessage`, `getChatHistory`)
- [ ] Добавить автопродление сессии (опционально)
  - Интервал 4 минуты → вызов `/webhook/auth-refresh`

**Файлы:**
- `src/App.tsx`
- `src/utils/api.ts`
- `src/components/AuthGuard.tsx`
- `front/VoiceAssistantPage.tsx`

---

### Этап 5: Дополнительные улучшения (опционально, 1-2 дня)

**Задачи:**
- [ ] Идемпотентность
  - Добавить проверку `Idempotency-Key` в `/webhook/chat.save-message`
  - Сохранять ответ в `idempotency_keys`
- [ ] Rate Limiting
  - Добавить проверку в мутирующих эндпоинтах
  - Вернуть 429 при превышении лимита
- [ ] Audit logging
  - Логировать все действия в `audit_events`
- [ ] Switch Company
  - Создать `/webhook/auth-switch-company`
  - Обновить `sessions.active_company_id`
- [ ] Cron jobs (Schedule Triggers)
  - Удаление просроченных сессий (раз в час)
  - Удаление старых idempotency_keys (раз в день)
  - Удаление старых rate_limits (раз в час)

---

### Этап 6: Тестирование и документация (1 день)

**Задачи:**
- [ ] Интеграционное тестирование (см. тест-план ниже)
- [ ] Обновить `back/README.md` с новыми эндпойнтами
- [ ] Создать примеры curl-запросов для тестирования API
- [ ] Документировать все n8n воркфлоу (названия, входы/выходы)

---

## ✅ Тест-план (чек-лист)

### Авторизация
- [ ] **auth-init (новый пользователь)**: создаётся user, возвращается `session_token`, роль `null` (нет компании)
- [ ] **auth-init (существующий пользователь)**: обновляется user, создаётся новая сессия, возвращается роль из `user_companies`
- [ ] **auth-init (невалидный initData)**: возвращается 401 с ошибкой HMAC
- [ ] **auth.validate (валидный токен)**: возвращается context с userId, role, companyId
- [ ] **auth.validate (невалидный токен)**: возвращается 401
- [ ] **auth.validate (просроченная сессия)**: возвращается 401
- [ ] **auth.refresh**: `expires_at` продлевается, возвращается новая дата
- [ ] **auth-logout**: сессия удаляется, последующие запросы с этим токеном → 401

### Чаты
- [ ] **chat.create (без токена)**: → 401
- [ ] **chat.create (с токеном)**: создаётся чат с `company_id = context.companyId`, возвращается chat object
- [ ] **chat.getHistory (свой чат)**: возвращается список сообщений
- [ ] **chat.getHistory (чужой чат, другая компания)**: → 403 или пустой список
- [ ] **chat.saveMessage (с Idempotency-Key)**: сообщение сохраняется
- [ ] **chat.saveMessage (повторный с тем же Idempotency-Key)**: возвращается кэшированный ответ, дубликат не создаётся

### Роли и RBAC
- [ ] **owner видит все чаты своей компании**: фильтрация по `company_id` работает
- [ ] **manager видит только чаты своей компании**: фильтрация по `company_id` работает
- [ ] **manager НЕ может удалить чат**: → 403
- [ ] **owner может удалить чат**: чат удаляется

### Rate Limiting
- [ ] **превышен лимит (31-й запрос за минуту)**: → 429 Too Many Requests
- [ ] **в новой минуте счётчик сбрасывается**: запросы проходят

### Идемпотентность
- [ ] **повторный POST с тем же Idempotency-Key**: возвращается сохранённый ответ, запись не дублируется
- [ ] **POST с новым Idempotency-Key**: создаётся новая запись

### Аудит
- [ ] **действия логируются в audit_events**: login, chat.create, message.save

## 📚 Приложения

### A. Код проверки Telegram initData (для Function Node в n8n)

```javascript
// Function Node в воркфлоу auth-init
const crypto = require('crypto');

const BOT_TOKEN = 'YOUR_BOT_TOKEN'; // из env или n8n credentials

function verifyTelegramInitData(initData) {
  try {
    // 1. Парсим initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    if (!hash) {
      return { valid: false, error: 'Missing hash' };
    }
    
    // 2. Сортируем ключи и создаём data-check-string
    const dataCheckArr = [];
    for (const [key, value] of params.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');
    
    // 3. Вычисляем secret_key = HMAC_SHA256("WebAppData", BOT_TOKEN)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    // 4. Вычисляем data_hash = HMAC_SHA256(secret_key, data_check_string)
    const dataHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // 5. Сравниваем
    if (dataHash !== hash) {
      return { valid: false, error: 'Invalid hash' };
    }
    
    // 6. Проверяем auth_date (не старше 5 минут)
    const authDate = parseInt(params.get('auth_date'));
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 300) { // 5 минут
      return { valid: false, error: 'Auth date too old' };
    }
    
    // 7. Извлекаем user
    const userStr = params.get('user');
    if (!userStr) {
      return { valid: false, error: 'Missing user data' };
    }
    
    const user = JSON.parse(userStr);
    
    return {
      valid: true,
      user: {
        id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        language_code: user.language_code || 'ru'
      }
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Использование в n8n
const initData = $json.initData; // из webhook body
const result = verifyTelegramInitData(initData);

if (!result.valid) {
  // Вернуть ошибку 401
  return {
    json: {
      error: 'unauthorized',
      status: 401,
      message: result.error,
      traceId: $json.traceId || crypto.randomUUID()
    }
  };
}

// Передать user дальше
return { json: { user: result.user } };
```

---

### B. Примеры curl-запросов для тестирования

#### 1. Auth Init
```bash
curl -X POST https://your-domain.com/webhook/auth-init \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1699000000&hash=abc123...",
    "appVersion": "1.0.0"
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "session_token": "550e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "telegram_id": 279058397,
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe"
    },
    "companyId": "c0e4567-e89b-12d3-a456-426614174999",
    "role": "owner"
  },
  "traceId": "..."
}
```

#### 2. Create Chat
```bash
TOKEN="550e8400-e29b-41d4-a716-446655440000"

curl -X POST https://your-domain.com/webhook/chat.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My First Chat"
  }'
```

#### 3. Get Chat History
```bash
curl -X POST https://your-domain.com/webhook/chat.get-history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "chatId": "abc-123-chat-id"
  }'
```

#### 4. Save Message (с идемпотентностью)
```bash
IDEMPOTENCY_KEY=$(uuidgen)

curl -X POST https://your-domain.com/webhook/chat.save-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "chatId": "abc-123-chat-id",
    "role": "user",
    "content": "Hello, AI!"
  }'
```

#### 5. Logout
```bash
curl -X POST https://your-domain.com/webhook/auth-logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

### C. Конвенции именования n8n воркфлоу

**Рекомендуемая структура:**

```
/auth
  ├── init (webhook)
  ├── validate (subworkflow)
  ├── refresh (subworkflow)
  ├── authorize (subworkflow)
  └── logout (webhook)

/chat
  ├── create (webhook)
  ├── get-history (webhook)
  ├── save-message (webhook)
  └── delete (webhook, только owner)

/analytics
  └── log-event (webhook)

/admin (будущее)
  ├── list-users (webhook)
  └── assign-role (webhook)
```

**Префиксы:**
- Webhook: `/webhook/auth-init`, `/webhook/chat.create`
- Subworkflow: `auth.validate`, `chat.authorize`

---

### D. Environment Variables (для n8n)

**Добавить в `.env` или n8n credentials:**

```env
# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Database (уже есть в Supabase)
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password

# Sessions
SESSION_LIFETIME_DAYS=7
SESSION_GRACE_MINUTES=5

# Rate Limits
RATE_LIMIT_MESSAGES_PER_MINUTE=30
RATE_LIMIT_EVENTS_PER_MINUTE=100

# Features
ENABLE_IDEMPOTENCY=true
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGGING=true
```

---

### E. Полная SQL миграция

**Файл:** `back/supabase/migrations/20251104_auth_system.sql`

```sql
-- ============================================
-- Auth System Migration
-- Дата: 2025-11-04
-- ============================================

-- 1. Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Companies (роли)
CREATE TABLE IF NOT EXISTS user_companies (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);

-- 3. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip TEXT,
  active_company_id UUID REFERENCES companies(id) ON DELETE SET NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- 4. Обновить chats (добавить company_id если нет)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chats_company ON chats(company_id);

-- 5. Audit Events (опционально)
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id UUID,
  meta JSONB DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_company ON audit_events(company_id);
CREATE INDEX idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX idx_audit_action ON audit_events(action);

-- 6. Idempotency Keys (опционально)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idempotency_created ON idempotency_keys(created_at);

-- 7. Rate Limits (опционально)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  minute_bucket TIMESTAMPTZ NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint, minute_bucket)
);

CREATE INDEX idx_rate_limits_bucket ON rate_limits(minute_bucket);

-- 8. Тестовые данные (опционально)
-- INSERT INTO companies (id, name) VALUES 
--   ('c0e4567-e89b-12d3-a456-426614174999', 'Test Company A'),
--   ('c0e4567-e89b-12d3-a456-426614175000', 'Test Company B');
```

---

## 🎯 Итоги и принципы

### Что мы получаем

✅ **Единая точка авторизации**: все запросы проходят через `auth.validate`  
✅ **RBAC**: роли (owner, manager, viewer) и проверка прав на ресурсы  
✅ **Изоляция данных**: каждая компания видит только свои данные  
✅ **Сессии с автопродлением**: grace window + скользящее окно  
✅ **Единый формат API**: ошибки и успешные ответы в едином стиле  
✅ **Идемпотентность**: защита от дублирования запросов  
✅ **Rate Limiting**: защита от спама  
✅ **Audit Log**: полная история действий пользователей  

### Принципы разработки

1. **Простота важнее**: без JWT, без сложных схем — UUID-токен в БД
2. **KISS**: одна точка валидации (`auth.validate`), единый паттерн для всех воркфлоу
3. **Безопасность**: HMAC-проверка Telegram initData, изоляция по компаниям
4. **Расширяемость**: легко добавить новые роли, ресурсы, эндпойнты
5. **Наблюдаемость**: traceId, audit_events, логирование

### Следующие шаги

1. Начать с **Этапа 1** (База данных)
2. Создать **auth.validate** и **auth-init** (Этап 2)
3. Протестировать авторизацию отдельно
4. Обновить существующие воркфлоу (Этап 3)
5. Интегрировать с фронтендом (Этап 4)
6. Добавить улучшения (Этап 5)

---

**Документ готов к использованию как руководство по внедрению системы авторизации.**

