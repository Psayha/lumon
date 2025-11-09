# Документация: Бэкапы и Health Checks

## Структура

### Бэкапы
- **Таблица БД**: `backups` - хранит метаданные бэкапов
- **Скрипты**: 
  - `back/scripts/create-backup.sh` - создание бэкапа
  - `back/scripts/restore-backup.sh` - восстановление из бэкапа
- **Workflows**:
  - `backup.create.json` - создание бэкапа
  - `backup.list.json` - список бэкапов
  - `backup.restore.json` - восстановление из бэкапа
  - `backup.delete.json` - удаление бэкапа
- **Таб в админке**: `BackupsTab.tsx` - управление бэкапами

### Health Checks
- **Таблицы БД**: 
  - `health_checks` - результаты проверок
  - `system_status` - общий статус системы
- **Скрипт**: `back/scripts/health-check.sh` - проверка всех сервисов
- **Workflows**:
  - `health-check.json` - выполнение проверки здоровья системы
  - `health-check-list.json` - список проверок и статус системы
- **Таб в админке**: `HealthChecksTab.tsx` - мониторинг системы

## Автоматизация

Для автоматических бэкапов можно настроить cron:
```bash
# Ежедневный бэкап в 2:00
0 2 * * * /var/www/lumon2/back/scripts/create-backup.sh
```

Для автоматических health-checks:
```bash
# Проверка каждые 5 минут
*/5 * * * * /var/www/lumon2/back/scripts/health-check.sh all
```

## Использование Context7

Context7 (https://context7.com) можно использовать для:
- Хранения контекста и истории проверок
- Интеграции с MCP сервером для автоматизации
- Мониторинга и алертинга

