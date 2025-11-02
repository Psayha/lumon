# 🚀 Деплой n8n Workflows на сервер

## 📋 Подготовка сервера

### 1. Требования

- Docker и Docker Compose установлены
- Порты свободны: `5432`, `5678`, `3001`
- Доступ к серверу (SSH)

### 2. Настройка переменных окружения

На сервере создайте `.env` файл в папке `back/`:

```bash
# PostgreSQL / Supabase
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ВАШ_НАДЕЖНЫЙ_ПАРОЛЬ
POSTGRES_DB=lumon

# n8n
N8N_USER=admin
N8N_PASSWORD=ВАШ_НАДЕЖНЫЙ_ПАРОЛЬ_n8n
N8N_ENCRYPTION_KEY=ВАШ_СЛУЧАЙНЫЙ_КЛЮЧ_32_СИМВОЛА

# n8n Host (для продакшена)
N8N_HOST=ваш-домен.com
N8N_PROTOCOL=https
```

**⚠️ ВАЖНО:** Смените все пароли и ключи на надежные значения!

## 🐳 Запуск на сервере

### Шаг 1: Клонируйте репозиторий (если еще не сделано)

```bash
git clone <your-repo-url>
cd lumon2/back
```

### Шаг 2: Создайте .env файл

```bash
cp .env.example .env
nano .env  # или vim .env
```

### Шаг 3: Обновите docker-compose.yml для продакшена

Если нужен HTTPS/домен, обновите:

```yaml
n8n:
  environment:
    - N8N_HOST=ваш-домен.com
    - N8N_PROTOCOL=https
```

### Шаг 4: Запустите сервисы

```bash
docker-compose up -d
```

### Шаг 5: Проверьте статус

```bash
docker-compose ps
```

Должны быть запущены:
- `lumon-supabase-db` (PostgreSQL)
- `lumon-supabase-studio` (Supabase Studio)
- `lumon-n8n` (n8n)

## 📥 Импорт workflows на сервере

### Шаг 1: Откройте n8n

1. Откройте `http://ваш-сервер:5678` или `https://ваш-домен.com:5678`
2. Войдите с учетными данными из `.env`

### Шаг 2: Создайте PostgreSQL Credential

1. **Settings** → **Credentials** → **New** → **PostgreSQL**
2. Заполните:
   - **Name:** `Lumon PostgreSQL`
   - **Host:** `supabase-db` (используйте имя сервиса из docker-compose)
   - **Port:** `5432`
   - **Database:** `lumon`
   - **User:** `postgres`
   - **Password:** `ВАШ_ПАРОЛЬ_ИЗ_.env`
   - **SSL:** `false` (для внутренней сети Docker)

### Шаг 3: Импортируйте workflows

1. **Workflows** → **Import from File**
2. Импортируйте все 5 файлов из `back/n8n/workflows/`:
   - `save-message.json`
   - `get-chat-history.json`
   - `create-user.json`
   - `create-chat.json`
   - `analytics.json`

### Шаг 4: Настройте Credentials в workflows

В каждом workflow:
1. Откройте каждый **PostgreSQL node**
2. Выберите credential: `Lumon PostgreSQL`
3. **Save**

### Шаг 5: Активируйте workflows

В каждом workflow переключите **Active = ON**

## ✅ Проверка работы

### Проверьте endpoints:

```bash
# Create User
curl -X POST http://ваш-сервер:5678/webhook/create-user \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": 123456789, "first_name": "Test"}'

# Get Chat History
curl "http://ваш-сервер:5678/webhook/get-chat-history?chat_id=xxx"
```

### Проверьте Executions в n8n:

1. Откройте n8n
2. Перейдите в **Executions**
3. Убедитесь, что workflows выполняются успешно

## 🔒 Безопасность

### Рекомендации для продакшена:

1. **Смените все пароли** в `.env`
2. **Используйте HTTPS** (настройте reverse proxy: nginx/traefik)
3. **Ограничьте доступ** к портам (firewall)
4. **Регулярные бэкапы** PostgreSQL:
   ```bash
   docker-compose exec supabase-db pg_dump -U postgres lumon > backup.sql
   ```

## 🔄 Обновление workflows

После изменений в workflows:

1. Экспортируйте обновленные workflows из n8n
2. Замените файлы в `back/n8n/workflows/`
3. Закоммитьте в git
4. На сервере: `git pull`
5. Импортируйте обновленные workflows в n8n

## 📊 Мониторинг

### Логи:

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f n8n
docker-compose logs -f supabase-db
```

### Проверка статуса:

```bash
docker-compose ps
docker-compose exec supabase-db pg_isready -U postgres
```

## 🐛 Troubleshooting

### n8n не запускается:

1. Проверьте логи: `docker-compose logs n8n`
2. Проверьте `.env` файл
3. Проверьте порты: `netstat -tuln | grep 5678`

### PostgreSQL не доступен:

1. Проверьте логи: `docker-compose logs supabase-db`
2. Проверьте volume: `docker volume ls`
3. Проверьте подключение: `docker-compose exec supabase-db psql -U postgres -d lumon`

### Workflows не выполняются:

1. Проверьте, что workflows активированы (Active = ON)
2. Проверьте credentials в PostgreSQL nodes
3. Проверьте Executions в n8n для ошибок

## 📝 Checklist деплоя

- [ ] Docker и Docker Compose установлены
- [ ] `.env` файл создан с продакшн значениями
- [ ] `docker-compose up -d` выполнен успешно
- [ ] Все контейнеры запущены (`docker-compose ps`)
- [ ] n8n доступен через браузер
- [ ] PostgreSQL Credential создан в n8n
- [ ] Все 5 workflows импортированы
- [ ] Credentials настроены в каждом workflow
- [ ] Все workflows активированы
- [ ] Тестовые запросы работают
- [ ] HTTPS настроен (для продакшена)
- [ ] Firewall настроен
- [ ] Бэкапы настроены

## ✅ Готово!

После выполнения всех шагов, ваш сервер готов к работе!

Frontend может отправлять запросы на:
- `http://ваш-сервер:5678/webhook/create-user`
- `http://ваш-сервер:5678/webhook/create-chat`
- `http://ваш-сервер:5678/webhook/save-message`
- `http://ваш-сервер:5678/webhook/get-chat-history`
- `http://ваш-сервер:5678/webhook/analytics`

