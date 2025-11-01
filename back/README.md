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

Миграции находятся в `../base/supabase/migrations/`

Первая миграция (`001_initial_schema.sql`) создает:
- `users` - пользователи Telegram
- `chats` - сессии чатов (хранение 14 дней)
- `messages` - сообщения чатов
- `documents` - документы базы знаний
- `analytics_events` - события аналитики

## 📝 Следующие шаги

### 1. Настройка n8n Workflows

1. Откройте n8n: http://localhost:5678
2. Создайте базовые workflows для API endpoints:
   - `/webhook/save-message` - сохранение сообщений чата
   - `/webhook/get-chat-history` - получение истории чата
   - `/webhook/create-user` - создание пользователя
   - `/webhook/analytics` - отправка аналитики

### 2. Создание API Workflows

Каждый workflow должен:
- Получать данные через Webhook Trigger
- Валидировать входные данные
- Сохранять в PostgreSQL через Supabase
- Возвращать JSON ответ

### 3. Интеграция с Frontend

1. Создайте конфигурацию API в frontend:
   ```typescript
   // src/config/api.ts
   export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5678';
   ```

2. Используйте `useApi` хук для запросов:
   ```typescript
   const { data, loading, error } = useApi(`${API_BASE_URL}/webhook/save-message`, {
     method: 'POST',
     body: JSON.stringify({ message, userId })
   });
   ```

### 4. Переменные окружения Frontend

Создайте `.env` в корне проекта:
```
REACT_APP_API_URL=http://localhost:5678
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
