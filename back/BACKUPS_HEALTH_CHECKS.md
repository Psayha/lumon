# Документация: Бэкапы и Health Checks

## Структура

### Бэкапы
- **Таблица БД**: `backups` - хранит метаданные бэкапов
- **Скрипты**: 
  - `back/scripts/create-backup.sh` - создание бэкапа
  - `back/scripts/restore-backup.sh` - восстановление из бэкапа
- **Workflows**:
  - `backup.create.json` - создание бэкапа (базовая версия)
  - ⏳ `backup.list.json` - список бэкапов (нужно создать)
  - ⏳ `backup.restore.json` - восстановление (нужно создать)
  - ⏳ `backup.delete.json` - удаление (нужно создать)
- **Таб в админке**: `BackupsTab.tsx` - управление бэкапами

### Health Checks
- **Таблицы БД**: 
  - `health_checks` - результаты проверок
  - `system_status` - общий статус системы
- **Скрипт**: `back/scripts/health-check.sh` - проверка всех сервисов
- **Workflows**:
  - ⏳ `health-check.json` - выполнение проверки (нужно создать)
  - ⏳ `health-check-list.json` - список проверок (нужно создать)
- **Таб в админке**: `HealthChecksTab.tsx` - мониторинг системы

## Что нужно доделать

1. **Workflow admin.validate** - для валидации admin токена в других workflows
2. **Workflow backup.list** - получение списка бэкапов из БД
3. **Workflow backup.restore** - восстановление из бэкапа (вызов скрипта)
4. **Workflow backup.delete** - удаление бэкапа (файл + запись в БД)
5. **Workflow health-check** - выполнение проверки здоровья системы
6. **Workflow health-check-list** - получение списка проверок

## Использование Context7

Context7 (https://context7.com) можно использовать для:
- Хранения контекста и истории проверок
- Интеграции с MCP сервером для автоматизации
- Мониторинга и алертинга

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

