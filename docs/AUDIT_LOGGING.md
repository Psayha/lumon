# 📋 Система аудита и логирования

## 📊 Текущее состояние

### ✅ Что логируется сейчас

**Системные действия (cron workflows):**
- `cron.cleanup` - очистка базы данных (action: `cron.cleanup`, resource: `database`)
- `cron.export-workflows` - экспорт workflows (action: `cron.export-workflows`, resource: `workflows`)

**Где логируется:**
- `back/n8n/workflows/cron.cleanup.json` - узел "Postgres: Log Audit Event"
- `back/n8n/workflows/cron.export-workflows.json` - узел "Log Audit Event"

### ✅ Что логируется (обновлено: 9 ноября 2025)

**Действия пользователей:**
- ✅ Создание чата (`chat.create`) - `chat.created`
- ✅ Сохранение сообщения (`save-message.json`) - `message.sent`
- ✅ Вход в систему (`auth.init.v3.json`) - `auth.login`
- ✅ Выход из системы (`auth.logout.json`) - `auth.logout`

**Административные действия:**
- ✅ Вход в админ-панель (`admin.login.json`) - `admin.login`
- ✅ Изменение лимитов (`admin.user-limits-update.json`) - `admin.user_limits_updated`
- ✅ Создание A/B эксперимента (`admin.ab-experiment-create.json`) - `admin.ab_experiment_created`
- ✅ Обновление A/B эксперимента (`admin.ab-experiment-update.json`) - `admin.ab_experiment_updated`

### ❌ Что НЕ логируется (опционально)

**Действия пользователей:**
- ❌ Получение истории чата (`chat.get-history`) - низкий приоритет
- ❌ Список чатов (`chat.list`) - низкий приоритет
- ❌ Смена компании (`auth.switch-company`) - низкий приоритет

**Административные действия:**
- ❌ Просмотр пользователей (`admin.users-list`) - низкий приоритет (только чтение)

## 🎯 Что нужно логировать

### Приоритет 1: Критические действия пользователей
1. **Создание чата** (`chat.create`)
   - `action`: `chat.created`
   - `resource_type`: `chat`
   - `resource_id`: ID созданного чата
   - `metadata`: `{ title, user_id }`

2. **Сохранение сообщения** (`chat.save-message`)
   - `action`: `message.sent`
   - `resource_type`: `message`
   - `resource_id`: ID сообщения
   - `metadata`: `{ chat_id, role, message_length }`

3. **Вход в систему** (`auth.init`)
   - `action`: `auth.login`
   - `resource_type`: `session`
   - `metadata`: `{ telegram_id, username }`

4. **Выход из системы** (`auth.logout`)
   - `action`: `auth.logout`
   - `resource_type`: `session`
   - `metadata`: `{ session_id }`

### Приоритет 2: Административные действия
1. **Вход в админ-панель** (`admin.login`)
   - `action`: `admin.login`
   - `resource_type`: `admin_session`
   - `metadata`: `{ admin_user_id }`

2. **Изменение лимитов пользователя** (`admin.user-limits-update`)
   - `action`: `admin.user_limits_updated`
   - `resource_type`: `user_limits`
   - `resource_id`: ID лимита
   - `metadata`: `{ user_id, limit_type, old_value, new_value }`

3. **Создание A/B эксперимента** (`admin.ab-experiment-create`)
   - `action`: `admin.ab_experiment_created`
   - `resource_type`: `ab_experiment`
   - `resource_id`: ID эксперимента
   - `metadata`: `{ name, feature_name, traffic_percentage }`

4. **Обновление A/B эксперимента** (`admin.ab-experiment-update`)
   - `action`: `admin.ab_experiment_updated`
   - `resource_type`: `ab_experiment`
   - `resource_id`: ID эксперимента
   - `metadata`: `{ changes }`

## 🔧 Как настроить логирование

### Шаг 1: Создать узел для логирования

В каждом workflow после успешного выполнения действия добавить узел **Postgres** с операцией **Insert**:

```json
{
  "parameters": {
    "operation": "insert",
    "schema": {
      "value": "public",
      "mode": "list"
    },
    "table": {
      "value": "audit_events",
      "mode": "list"
    },
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "user_id": "={{ $('Parse Auth Response').item.json.data.user.id }}",
        "action": "chat.created",
        "resource_type": "chat",
        "resource_id": "={{ $('Create Chat').item.json.id }}",
        "metadata": "={{ JSON.stringify({ title: $('Extract Token').item.json.title }) }}",
        "ip": "={{ $('Webhook Trigger').item.json.headers['x-forwarded-for'] || $('Webhook Trigger').item.json.headers['x-real-ip'] || 'unknown' }}",
        "user_agent": "={{ $('Webhook Trigger').item.json.headers['user-agent'] || 'unknown' }}"
      }
    }
  },
  "type": "n8n-nodes-base.postgres",
  "credentials": {
    "postgres": {
      "id": "OPy15M2cOLEss5yi",
      "name": "Postgres account"
    }
  }
}
```

### Шаг 2: Добавить узел в workflow

1. После успешного выполнения основного действия (например, `Create Chat`)
2. Перед узлом `Build Response`
3. С `continueOnFail: true` (чтобы не прерывать основной flow при ошибке логирования)

### Шаг 3: Пример для `chat.create`

```json
{
  "nodes": [
    // ... существующие узлы ...
    {
      "id": "create-chat",
      "name": "Create Chat",
      // ... параметры ...
    },
    {
      "id": "log-audit-event",
      "name": "Log Audit Event",
      "type": "n8n-nodes-base.postgres",
      "position": [2450, 600],
      "continueOnFail": true,
      "parameters": {
        "operation": "insert",
        "schema": { "value": "public", "mode": "list" },
        "table": { "value": "audit_events", "mode": "list" },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "user_id": "={{ $('Parse Auth Response').item.json.data.user.id }}",
            "action": "chat.created",
            "resource_type": "chat",
            "resource_id": "={{ $('Create Chat').item.json.id }}",
            "metadata": "={{ JSON.stringify({ title: $('Extract Token').item.json.title }) }}",
            "ip": "={{ $('Webhook Trigger').item.json.headers['x-forwarded-for'] || $('Webhook Trigger').item.json.headers['x-real-ip'] || 'unknown' }}",
            "user_agent": "={{ $('Webhook Trigger').item.json.headers['user-agent'] || 'unknown' }}"
          }
        }
      },
      "credentials": {
        "postgres": {
          "id": "OPy15M2cOLEss5yi",
          "name": "Postgres account"
        }
      }
    },
    {
      "id": "format-response",
      "name": "Build Response",
      // ... параметры ...
    }
  ],
  "connections": {
    "Create Chat": {
      "main": [
        [
          {
            "node": "Log Audit Event",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Log Audit Event": {
      "main": [
        [
          {
            "node": "Build Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📝 Формат действий

### Соглашения по именованию

**Формат:** `{module}.{action}`

**Примеры:**
- `chat.created` - создан чат
- `chat.message_sent` - отправлено сообщение
- `auth.login` - вход в систему
- `auth.logout` - выход из системы
- `admin.login` - вход в админ-панель
- `admin.user_limits_updated` - обновлены лимиты пользователя
- `admin.ab_experiment_created` - создан A/B эксперимент

### Типы ресурсов

- `chat` - чат
- `message` - сообщение
- `session` - сессия пользователя
- `admin_session` - сессия администратора
- `user_limits` - лимиты пользователя
- `ab_experiment` - A/B эксперимент
- `ab_assignment` - назначение в A/B тест

## 🔍 Просмотр логов

Логи доступны в админ-панели:
- **Таб "System Logs"** (`adminpage/tabs/LogsTab.tsx`)
- **API endpoint**: `GET /webhook/admin-logs-list`
- **Workflow**: `back/n8n/workflows/admin.logs-list.json`

## ✅ Чеклист настройки

- [x] Добавить логирование в `chat.create` ✅
- [x] Добавить логирование в `save-message.json` ✅
- [x] Добавить логирование в `auth.init.v3.json` ✅
- [x] Добавить логирование в `auth.logout.json` ✅
- [x] Добавить логирование в `admin.login.json` ✅
- [x] Добавить логирование в `admin.user-limits-update.json` ✅
- [x] Добавить логирование в `admin.ab-experiment-create.json` ✅
- [x] Добавить логирование в `admin.ab-experiment-update.json` ✅
- [ ] Проверить работу логирования в админ-панели

**Статус:** Все workflows обновлены (9 ноября 2025)

## 📚 Связанные документы

- [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) - Система аутентификации
- [ANALYTICS_ADMIN.md](./ANALYTICS_ADMIN.md) - Аналитика и администрирование

