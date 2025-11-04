# 🚀 Инструкция по запуску миграции

## 1️⃣ Запуск SQL миграции в Supabase

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Открой Supabase Dashboard: https://supabase.com/dashboard
2. Выбери свой проект
3. Слева → **SQL Editor**
4. Нажми **"New Query"**
5. Скопируй содержимое файла: `back/supabase/migrations/20251104000001_auth_system.sql`
6. Вставь в редактор
7. Нажми **"Run"** (или `Ctrl/Cmd + Enter`)

✅ Если всё ОК — увидишь "Success. No rows returned"

---

### Вариант B: Через Supabase CLI (локально)

```bash
cd /Users/valesios/Desktop/lumon2/back

# 1. Применить миграцию
supabase db push

# Или напрямую:
psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  -f supabase/migrations/20251104000001_auth_system.sql
```

---

### Вариант C: Через psql напрямую

```bash
# Подключись к Supabase PostgreSQL
psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Затем выполни:
\i /Users/valesios/Desktop/lumon2/back/supabase/migrations/20251104000001_auth_system.sql

# Выход:
\q
```

---

## 2️⃣ Проверка таблиц

После миграции проверь, что таблицы созданы:

```sql
-- В Supabase SQL Editor или psql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'companies', 'users', 'user_companies', 
    'sessions', 'chats', 'messages', 
    'audit_events', 'idempotency_keys', 'rate_limits'
  )
ORDER BY table_name;
```

Должно вернуть **9 таблиц**.

---

## 3️⃣ Создание тестовых данных (опционально)

Для локального тестирования создай тестовые данные:

```sql
-- Тестовая компания
INSERT INTO companies (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Company')
ON CONFLICT DO NOTHING;

-- Тестовый пользователь (замени telegram_id на свой)
INSERT INTO users (id, telegram_id, username, first_name, last_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 123456789, 'test_user', 'Test', 'User')
ON CONFLICT (telegram_id) DO NOTHING;

-- Связь пользователя с компанией (роль owner)
INSERT INTO user_companies (user_id, company_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner')
ON CONFLICT (user_id, company_id) DO NOTHING;
```

---

## 4️⃣ Настройка n8n (Telegram Bot Token)

1. Открой n8n: http://91.229.10.47:5678 (или твой URL)
2. Слева → **Settings** → **Environment Variables**
3. Добавь переменную:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: `твой_токен_от_@BotFather`
4. **Restart n8n**:

```bash
cd /Users/valesios/Desktop/lumon2/back
docker-compose restart n8n
```

---

## 5️⃣ Настройка PostgreSQL credentials в n8n

1. Открой n8n → **Credentials** (слева внизу)
2. Нажми **"Add Credential"**
3. Выбери **"Postgres"**
4. Заполни:
   - **Name**: `Supabase PostgreSQL`
   - **Host**: `db.YOUR_PROJECT_REF.supabase.co`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: `твой_supabase_password`
   - **Port**: `5432`
   - **SSL**: `allow` или `require`
5. **Save**

---

## 6️⃣ Импорт обновлённого auth.validate

1. В n8n открой workflow **auth.validate**
2. Нажми **три точки** (⋮) → **Delete**
3. Импортируй заново: **Settings** → **Import from File** → выбери `back/n8n/workflows/auth.validate.json`
4. **Activate** workflow

---

## 7️⃣ Активация workflows

1. **auth.init** → Activate
2. **auth.validate** → Activate
3. **chat.create** → Activate

В `chat.create` нужно указать ID workflow `auth.validate`:
1. Открой **chat.create**
2. Найди ноду **"Execute: auth.validate"**
3. В поле **"Workflow ID"** выбери **"auth.validate"** из списка
4. **Save**

---

## 8️⃣ Тестирование через ApiTestPage

```bash
cd /Users/valesios/Desktop/lumon2
npm run dev
```

Открой: http://localhost:3000 → **API Test**

1. Выбери **"Auth Init"**
2. Нажми **"Загрузить тестовые данные"**
3. Нажми **"🚀 Тестировать POST"**
4. Если ОК → увидишь `session_token`

---

## ✅ Checklist

- [ ] SQL миграция применена
- [ ] 9 таблиц созданы
- [ ] PostgreSQL credential добавлен в n8n
- [ ] TELEGRAM_BOT_TOKEN добавлен в n8n env
- [ ] auth.validate переимпортирован и активирован
- [ ] auth.init активирован
- [ ] chat.create активирован и связан с auth.validate
- [ ] Тестовые данные созданы (опционально)
- [ ] ApiTestPage работает

---

## 🐛 Troubleshooting

### Ошибка: "relation 'users' does not exist"
→ Миграция не применена. Повтори шаг 1.

### Ошибка: "could not connect to server"
→ Проверь PostgreSQL credentials в n8n.

### Ошибка: "Workflow has no trigger node"
→ Переимпортируй `auth.validate.json` (обновлённый).

### auth-init возвращает 401 "Invalid hash"
→ Это норма для тестов. В `auth.init` workflow раскомментируй проверку hash, когда будешь готов к продакшену.

