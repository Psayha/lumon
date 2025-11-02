# 🏠 Локальная разработка

## Быстрый старт

### 1. Настройка окружения

```bash
cd back

# Создай .env файл из примера
cp env.example .env

# Или используй локальный пример
# cp .env.local.example .env
```

### 2. Запуск сервисов

```bash
# Запусти Docker Compose
docker compose up -d

# Проверь что все запустилось
docker compose ps

# Проверь логи если нужно
docker compose logs n8n
docker compose logs supabase-studio
```

### 3. Доступ к сервисам

- **n8n**: http://localhost:5678
  - Логин: `admin`
  - Пароль: `lumon_dev`
- **Supabase Studio**: http://localhost:3001
- **PostgreSQL**: `localhost:5432`
  - User: `postgres`
  - Password: `lumon_dev_password`
  - Database: `lumon`

### 4. Настройка Frontend

Фронтенд автоматически использует `http://localhost:5678` для API (см. `src/config/api.ts`).

Для запуска фронтенда:

```bash
# В корне проекта
npm install
npm run dev
```

Фронтенд будет доступен на http://localhost:5173 (или другой порт Vite)

## Переменные окружения

### Локальная разработка (.env)

```bash
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_SECURE_COOKIE=false
```

### Продакшн (.env.production)

```bash
N8N_HOST=n8n.psayha.ru
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true  # После получения SSL
```

## Troubleshooting

### Ошибка "secure cookie"

**Проблема:** `Your n8n server is configured to use a secure cookie`

**Решение:** Убедись что в `.env` есть:
```bash
N8N_SECURE_COOKIE=false
```

Затем перезапусти:
```bash
docker compose restart n8n
```

### Контейнеры не запускаются

```bash
# Проверь логи
docker compose logs

# Пересоздай контейнеры
docker compose down
docker compose up -d --build
```

### Порты заняты

Если порты `5678`, `3001` или `5432` заняты:

1. Останови другие сервисы на этих портах
2. Или измени порты в `docker-compose.yml`

## Импорт workflows

После первого запуска n8n:

1. Открой http://localhost:5678
2. Создай owner account
3. Импортируй workflows из `back/n8n/workflows/`:
   - Analytics
   - Create Chat
   - Create User
   - Get Chat History
   - Save Message

4. Активируй все workflows (переключатель "Active")
5. Настрой PostgreSQL credentials в каждом workflow:
   - Host: `supabase-db`
   - Database: `lumon`
   - User: `postgres`
   - Password: `lumon_dev_password`
   - Port: `5432`

## Остановка сервисов

```bash
# Остановить все сервисы
docker compose down

# Остановить и удалить volumes (ВНИМАНИЕ: удалит данные!)
docker compose down -v
```

