# 🔧 Lumon Backend

Backend инфраструктура для Lumon Platform: n8n + Supabase

## 🏗️ Архитектура

- **n8n** - Workflow automation platform для бизнес-логики
- **Supabase** - PostgreSQL база данных + Studio для управления

## 📋 Требования

- Docker
- Docker Compose

## 🚀 Быстрый старт

### Windows (PowerShell)

#### 1. Первичная настройка

```powershell
cd back
.\scripts\setup-local.ps1
```

#### 2. Запуск для разработки

```powershell
.\scripts\start-dev.ps1
```

### Linux/Mac (Bash)

#### 1. Первичная настройка

```bash
cd back
chmod +x scripts/*.sh
./scripts/setup-local.sh
```

#### 2. Запуск для разработки

```bash
./scripts/start-dev.sh
```

### Или вручную (любая ОС):

```bash
docker-compose up -d
```

### 3. Доступ к сервисам

- **Supabase Studio**: http://localhost:3001
- **n8n**: http://localhost:5678
  - Пользователь: `admin` (из .env)
  - Пароль: `lumon_dev` (из .env)
- **PostgreSQL**: localhost:5432
  - База: `lumon`
  - Пользователь: `postgres`
  - Пароль: `lumon_dev_password` (из .env)

## 📁 Структура

```
back/
├── docker-compose.yml    # Docker Compose конфигурация
├── .env.example          # Пример переменных окружения
├── .env                  # Ваши переменные окружения (создается автоматически)
├── n8n/
│   └── workflows/        # Экспортированные n8n workflows
└── scripts/
    ├── setup-local.sh    # Первичная настройка
    └── start-dev.sh      # Запуск для разработки
```

## 🗄️ База данных

Миграции находятся в `supabase/migrations/`

**Применённые миграции:**
- `20251104000000_drop_old_tables.sql` - очистка старых таблиц
- `20251104000001_auth_system.sql` - auth система

**Таблицы:**
- `users` - пользователи Telegram (telegram_id, username, first_name, last_name)
- `companies` - компании
- `user_companies` - связь пользователь-компания с ролями (owner, manager, viewer)
- `sessions` - активные сессии (session_token, expires_at, last_activity_at)
- `chats` - сессии чатов (user_id, company_id, title)
- `messages` - сообщения чатов (chat_id, role, content, metadata)
- `audit_events` - аудит действий (опционально)
- `idempotency_keys` - идемпотентность запросов (опционально)
- `rate_limits` - ограничение частоты запросов (опционально)

**Применение миграций:**
```bash
./apply-migration.sh
```

## 📝 Следующие шаги

### 1. n8n Workflows (Актуальные)

#### Auth System (✅ Реализовано)
- `/webhook/auth-init-v2` - инициализация сессии (Telegram initData)
- `/webhook/auth-validate-v2` - валидация session_token
- `/webhook/auth-refresh` - продление сессии
- `/webhook/auth-logout` - завершение сессии
- `/webhook/auth-set-viewer-role` - установка роли viewer
- `auth.validate.v3` (subworkflow) - валидация токена

#### Chat System (✅ Реализовано)
- `/webhook/chat-create` - создание чата (с auth.validate)
- `/webhook/chat-save-message` - сохранение сообщения (с auth.validate)
- `/webhook/chat-get-history` - история чата (с auth.validate)

#### Analytics (⏳ В разработке)
- `/webhook/analytics` - логирование событий

### 2. Архитектура Workflows

Все бизнес-workflows следуют паттерну:
```
Webhook → auth.validate → Parse Auth Response → IF Auth Success → Бизнес-логика → Response
                                              → Response 401 (если auth failed)
```

**Единый формат ответов:**
```json
{
  "success": true,
  "data": { /* payload */ },
  "traceId": "uuid"
}
```

**Единый формат ошибок:**
```json
{
  "error": "unauthorized",
  "status": 401,
  "message": "Invalid or expired token",
  "traceId": "uuid"
}
```

### 3. Интеграция с Frontend (✅ Реализовано)

**API конфигурация:**
- `src/config/api.ts` - endpoints и headers
- `src/utils/api.ts` - API функции с retry и auth

**Автоматическая авторизация:**
- `AuthGuard` компонент инициализирует сессию при старте
- `Authorization: Bearer <session_token>` добавляется автоматически
- Автоматический re-auth при 401/403
- Автопродление сессии каждые 4 минуты

**Пример использования:**
```typescript
import { createChat, saveMessage } from './utils/api';

// Создание чата (userId берется из session_token)
const chatResponse = await createChat('My Chat');

// Сохранение сообщения
await saveMessage({
  chat_id: chatResponse.data.id,
  role: 'user',
  content: 'Hello!'
});
```

### 4. Переменные окружения

**Backend (.env):**
```env
POSTGRES_PASSWORD=lumon_dev_password
N8N_USER=admin
N8N_PASSWORD=lumon_dev
N8N_ENCRYPTION_KEY=your-encryption-key
TELEGRAM_BOT_TOKEN=your-bot-token
```

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:5678
```

## 🔧 Управление

### Остановка сервисов

```bash
docker-compose down
```

### Остановка с удалением данных

```bash
docker-compose down -v
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f n8n
docker-compose logs -f supabase-db
```

### Перезапуск сервиса

```bash
docker-compose restart n8n
docker-compose restart supabase-db
```

## 📝 Переменные окружения

Скопируйте `.env.example` в `.env` и отредактируйте:

```bash
cp .env.example .env
```

Важные переменные:
- `POSTGRES_PASSWORD` - пароль PostgreSQL
- `N8N_USER` / `N8N_PASSWORD` - учетные данные n8n
- `N8N_ENCRYPTION_KEY` - ключ шифрования n8n (смените в продакшене!)

## 🚢 Деплой на сервер

Когда будете готовы к деплою на сервер:

1. Скопируйте `docker-compose.yml` на сервер
2. Создайте `.env` с продакшн значениями
3. Запустите: `docker-compose up -d`

## 📚 Документация

- [n8n Documentation](https://docs.n8n.io/)
- [Supabase Documentation](https://supabase.com/docs)
