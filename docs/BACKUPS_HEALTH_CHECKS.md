# Документация: Бэкапы и Health Checks

> **Обновлено:** 6 ноября 2025

## Структура

### Бэкапы
- **Таблица БД**: `backups` - хранит метаданные бэкапов
- **Скрипты**: 
  - `back/scripts/create-backup.sh` - создание бэкапа
  - `back/scripts/restore-backup.sh` - восстановление из бэкапа
  - `back/scripts/cleanup-old-backups.sh` - очистка старых бэкапов (>30 дней)
  - `back/scripts/cron-backup.sh` - автоматический бэкап через cron
- **Workflows**:
  - `backup.create.json` - создание бэкапа
  - `backup.list.json` - список бэкапов
  - `backup.restore.json` - восстановление из бэкапа
  - `backup.delete.json` - удаление бэкапа
- **Таб в админке**: `BackupsTab.tsx` - управление бэкапами

### Health Checks
- **Таблицы БД**: 
  - `health_checks` - результаты проверок (с метриками в JSONB)
  - `system_status` - общий статус системы (с метриками в JSONB)
- **Скрипт**: `back/scripts/health-check.sh` - проверка всех сервисов
- **Workflows**:
  - `health-check.json` - выполнение проверки здоровья системы
  - `health-check-list.json` - список проверок и статус системы
- **Таб в админке**: `HealthChecksTab.tsx` - мониторинг системы с графиками метрик

## Автоматизация

### Автоматические бэкапы

Настроены cron скрипты для автоматических бэкапов:

```bash
# Ежедневный бэкап в 2:00
0 2 * * * /var/www/lumon2/back/scripts/cron-backup.sh >> /var/log/lumon/cron-backup.log 2>&1
```

**Скрипт `cron-backup.sh`:**
- Вызывает webhook `/webhook/backup-create` через n8n
- Логирует результаты в `/var/log/lumon/cron-backup.log`
- Отправляет алерты при ошибках (email/Telegram)

**Настройка переменных окружения:**
```bash
export N8N_URL="https://n8n.psayha.ru"
export ADMIN_TOKEN="your_admin_token"
export ALERT_EMAIL="admin@example.com"  # Опционально
export ALERT_TELEGRAM_BOT_TOKEN="bot_token"  # Опционально
export ALERT_TELEGRAM_CHAT_ID="chat_id"  # Опционально
```

### Автоматические health-checks

Настроены cron скрипты для автоматических проверок:

```bash
# Проверка каждые 10 минут
*/10 * * * * /var/www/lumon2/back/scripts/cron-health-check.sh >> /var/log/lumon/cron-health-check.log 2>&1
```

**Скрипт `cron-health-check.sh`:**
- Вызывает webhook `/webhook/health-check` через n8n
- Логирует результаты в `/var/log/lumon/cron-health-check.log`
- Отправляет алерты при проблемах (unhealthy/down статус)

**Настройка переменных окружения:**
```bash
export N8N_URL="https://n8n.psayha.ru"
export ADMIN_TOKEN="your_admin_token"
export ALERT_EMAIL="admin@example.com"  # Опционально
export ALERT_TELEGRAM_BOT_TOKEN="bot_token"  # Опционально
export ALERT_TELEGRAM_CHAT_ID="chat_id"  # Опционально
```

### Автоматическая очистка старых бэкапов

Очистка старых бэкапов (>30 дней) выполняется автоматически:

1. **Через cron.cleanup workflow** (каждый час):
   - Удаляет записи из таблицы `backups` старше 30 дней

2. **Через cron скрипт** (ежедневно в 3:00):
   ```bash
   0 3 * * * /var/www/lumon2/back/scripts/cleanup-old-backups.sh >> /var/log/lumon/cron-cleanup.log 2>&1
   ```
   - Удаляет файлы бэкапов старше 30 дней из `/var/backups/lumon/`
   - Удаляет записи из БД

### Быстрая настройка cron

Используйте скрипт `setup-cron.sh` для автоматической настройки всех cron задач:

```bash
cd /var/www/lumon2/back/scripts
sudo bash setup-cron.sh
```

## Алерты

### Настройка алертов

Алерты отправляются автоматически при:
- Ошибках создания бэкапов
- Проблемах со здоровьем системы (unhealthy/down статус)

**Email алерты:**
```bash
export ALERT_EMAIL="admin@example.com"
```

**Telegram алерты:**
```bash
export ALERT_TELEGRAM_BOT_TOKEN="your_bot_token"
export ALERT_TELEGRAM_CHAT_ID="your_chat_id"
```

Подробнее см. `back/scripts/ALERTS_README.md`

## Графики метрик

В админке (HealthChecksTab) доступны графики истории метрик:
- **CPU** - использование процессора (%)
- **Память** - использование памяти (%)
- **Диск** - использование диска (%)

Графики показывают последние 20 проверок системы с временными метками.

## Health Endpoint в Nginx

Создан пример конфига для `/health` endpoint (`back/nginx-health-endpoint.conf`):
- Простая проверка доступности nginx
- Проверка статуса сервисов (n8n, PostgreSQL)
- JSON ответ со статусом системы

## Экспорт n8n workflows

Настроен автоматический экспорт workflows:
- **Workflow**: `cron.export-workflows.json`
- **Расписание**: Еженедельно (воскресенье в 00:00)
- **Место хранения**: `/var/backups/lumon/workflows/`
- **Формат**: JSON с метаданными (дата экспорта, версия, количество workflows)

## Использование Context7 (опционально)

Context7 (https://context7.com) можно использовать для:
- Хранения расширенной истории метрик
- Интеграции с MCP сервером для автоматизации
- Расширенного мониторинга и алертинга

Текущая система использует БД для хранения метрик, что достаточно для базового мониторинга.

