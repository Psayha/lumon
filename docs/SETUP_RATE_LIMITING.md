# 🚦 Setup Rate Limiting

## Обзор

Subworkflow `rate-limit.check` реализует ограничение частоты запросов:
- **Mutating операции** (chat.create, chat.save-message): 30 req/min
- **Analytics**: 100 req/min

## Шаг 1: Импорт subworkflow

1. Открой n8n: https://n8n.psayha.ru
2. Импортируй `back/n8n/workflows/rate-limit.check.json`
3. Активируй workflow

## Шаг 2: Интеграция в chat.create

Добавь узел "Call Rate Limit" после "Parse Auth Response":

```json
{
  "parameters": {
    "workflowId": "rate-limit.check",
    "fieldsUi": {
      "values": [
        {
          "name": "user_id",
          "value": "={{ $('Parse Auth Response').item.json.data.user.id }}"
        },
        {
          "name": "endpoint",
          "value": "chat.create"
        }
      ]
    }
  },
  "id": "call-rate-limit",
  "name": "Call Rate Limit",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1,
  "position": [1250, 500]
}
```

Добавь узел "IF Rate Limit OK" после "Call Rate Limit":

```json
{
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "leftValue": "={{ $json.allowed }}",
          "rightValue": "true",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ]
    }
  },
  "id": "check-rate-limit-ok",
  "name": "IF Rate Limit OK",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [1450, 500]
}
```

Добавь узел "Respond Rate Limit" для ошибки:

```json
{
  "parameters": {
    "respondWith": "text",
    "responseBody": "={{ JSON.stringify($json) }}",
    "options": {
      "responseCode": "={{ $json.status || 429 }}"
    }
  },
  "id": "response-rate-limit",
  "name": "Respond Rate Limit",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1,
  "position": [1650, 400]
}
```

## Шаг 3: Интеграция в chat.save-message

Добавь узел "Call Rate Limit" после "Parse Auth Response" (аналогично chat.create, но с `endpoint: "chat.save-message"`):

```json
{
  "parameters": {
    "workflowId": "rate-limit.check",
    "fieldsUi": {
      "values": [
        {
          "name": "user_id",
          "value": "={{ $('Parse Auth Response').item.json.data.user.id }}"
        },
        {
          "name": "endpoint",
          "value": "chat.save-message"
        }
      ]
    }
  },
  "id": "call-rate-limit",
  "name": "Call Rate Limit",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1,
  "position": [1250, 500]
}
```

И аналогичные узлы "IF Rate Limit OK" и "Respond Rate Limit".

## Шаг 4: Интеграция в analytics.json

Добавь узел "Call Rate Limit" после "Parse Auth Response" с `endpoint: "analytics"`:

```json
{
  "parameters": {
    "workflowId": "rate-limit.check",
    "fieldsUi": {
      "values": [
        {
          "name": "user_id",
          "value": "={{ $('Parse Auth Response').item.json.data.user.id }}"
        },
        {
          "name": "endpoint",
          "value": "analytics"
        }
      ]
    }
  },
  "id": "call-rate-limit",
  "name": "Call Rate Limit",
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1,
  "position": [1050, 500]
}
```

## Шаг 5: Очистка старых записей

Создай cron job для очистки старых записей из `rate_limits`:

```sql
-- Запускать каждый час
DELETE FROM rate_limits 
WHERE created_at < NOW() - interval '1 hour';
```

Или добавь в n8n cron workflow:

```json
{
  "name": "cron.cleanup-rate-limits",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "DELETE FROM rate_limits WHERE created_at < NOW() - interval '1 hour';"
      },
      "name": "Cleanup Rate Limits",
      "type": "n8n-nodes-base.postgres",
      "position": [450, 300],
      "credentials": {
        "postgres": {
          "id": "supabase_postgres",
          "name": "Supabase PostgreSQL"
        }
      }
    }
  ]
}
```

## Тестирование

### 1. Тест нормального запроса
```bash
curl -X POST https://n8n.psayha.ru/webhook/chat-create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'
```

Ожидается: `200 OK` с данными чата.

### 2. Тест превышения лимита
Выполни 31 запрос за минуту:

```bash
for i in {1..31}; do
  curl -X POST https://n8n.psayha.ru/webhook/chat-create \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Test Chat $i\"}"
  echo "Request $i"
done
```

Ожидается: первые 30 - `200 OK`, 31-й - `429 Too Many Requests`.

### 3. Проверка таблицы
```sql
SELECT 
  user_id, 
  endpoint, 
  COUNT(*) as requests,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM rate_limits
WHERE created_at > NOW() - interval '1 minute'
GROUP BY user_id, endpoint
ORDER BY requests DESC;
```

## Критерии готовности

- ✅ Subworkflow `rate-limit.check` импортирован и активен
- ✅ Интегрирован в `chat.create`, `chat.save-message`, `analytics`
- ✅ Тест: 30 запросов проходят, 31-й возвращает 429
- ✅ Cron job для очистки старых записей работает
- ✅ Логирование показывает правильные лимиты в заголовках

## Структура ответа при превышении лимита

```json
{
  "allowed": false,
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded: 30/30 requests per minute",
  "status": 429,
  "limit": 30,
  "current": 30,
  "retry_after": 60
}
```

## Мониторинг

Добавь запрос для мониторинга лимитов:

```sql
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_request
FROM rate_limits
WHERE created_at > NOW() - interval '1 hour'
GROUP BY endpoint
ORDER BY total_requests DESC;
```

