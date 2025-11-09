# 🔍 Чек-лист диагностики авторизации и создания чатов

## Быстрая проверка цепочки

### 1. Проверка `auth-init-v2`

```bash
# Тест с curl
curl -X POST https://n8n.psayha.ru/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{"initData":"query_id=test&user=%7B%22id%22%3A123%7D","appVersion":"1.0.0"}' \
  -i

# Ожидаемый результат:
# HTTP/1.1 200 OK
# Content-Type: application/json
# {
#   "success": true,
#   "data": {
#     "session_token": "uuid-токен",
#     "user": { "id": "...", "role": "...", "company_id": "..." },
#     "expires_at": "..."
#   }
# }
```

**Что проверить:**
- ✅ Статус 200 OK
- ✅ Тело ответа не пустое
- ✅ Есть поле `data.session_token`
- ✅ Токен валидный UUID

### 2. Проверка `auth-validate-v2`

```bash
# Получите токен из предыдущего шага
TOKEN="ваш-токен-здесь"

curl -X POST https://n8n.psayha.ru/webhook/auth-validate-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"token\":\"$TOKEN\"}" \
  -i

# Ожидаемый результат:
# HTTP/1.1 200 OK
# {
#   "success": true,
#   "data": { "user": {...}, "role": "...", "company_id": "..." }
# }
```

**Что проверить:**
- ✅ Статус 200 OK
- ✅ `success: true`
- ✅ Есть данные пользователя

### 3. Проверка `chat-create`

```bash
# Используйте токен из auth-init-v2
TOKEN="ваш-токен-здесь"

# Вариант 1: Токен в query + body
curl -X POST "https://n8n.psayha.ru/webhook/chat-create?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"Test Chat\",\"session_token\":\"$TOKEN\"}" \
  -i

# Ожидаемый результат:
# HTTP/1.1 200 OK
# {
#   "success": true,
#   "data": { "id": "...", "title": "...", ... }
# }
```

**Что проверить:**
- ✅ Статус 200 OK (не 401)
- ✅ Чат создан (`data.id` присутствует)
- ✅ В логах n8n: `hasAuth: true` ИЛИ `hasSessionToken: true`

### 4. Проверка CORS (для браузера)

```bash
# Preflight запрос (OPTIONS)
curl -X OPTIONS https://n8n.psayha.ru/webhook/auth-validate-v2 \
  -H "Origin: https://psayha.ru" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -i

# Ожидаемый результат:
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: https://psayha.ru
# Access-Control-Allow-Methods: GET, POST, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

**Что проверить:**
- ✅ Статус 204 или 200
- ✅ Есть заголовки `Access-Control-Allow-*`
- ✅ `Access-Control-Allow-Origin` содержит `https://psayha.ru`

## Проверка в браузере

### 1. Проверка сохранения токена

```javascript
// В консоли браузера
localStorage.getItem('session_token')
// Должен вернуть непустую строку (UUID токен)
```

### 2. Проверка передачи токена

Откройте DevTools → Network → найдите запрос `chat-create`:
- **Headers**: должен быть `Authorization: Bearer <token>` (если не отключен)
- **Query Parameters**: должен быть `token=<токен>`
- **Request Payload**: должен быть `{"title":"...","session_token":"<токен>"}`

### 3. Проверка ответа

В Network → Response должен быть JSON:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "...",
    ...
  }
}
```

## Диагностика в n8n

### 1. Execution Log

1. Откройте n8n → Executions
2. Найдите последний execution для `auth-init-v2` или `chat-create`
3. Проверьте:
   - ✅ Дошел ли поток до "Respond to Webhook"?
   - ✅ Какая нода последняя перед Respond?
   - ✅ Есть ли ошибки в любой ноде?

### 2. Debug информация в 401 ответе

Если `chat-create` возвращает 401, проверьте debug информацию в ответе:
```json
{
  "error": "unauthorized",
  "debug": {
    "hasAuth": false,        // Должно быть true
    "hasSessionToken": false, // Должно быть true
    "queryKeys": [],         // Должен содержать ["token"]
    "bodyKeys": ["title"]    // Должен содержать ["title", "session_token"]
  }
}
```

**Что проверить:**
- Если `hasAuth: false` → токен не в заголовке Authorization
- Если `hasSessionToken: false` → токен не в body.session_token
- Если `queryKeys` пустой → токен не в query параметре

### 3. Проверка базы данных

```sql
-- Проверка сессии
SELECT * FROM sessions 
WHERE session_token = 'ваш-токен'
ORDER BY created_at DESC 
LIMIT 1;

-- Должна вернуться запись с:
-- - session_token (UUID)
-- - user_id
-- - expires_at (в будущем)
-- - created_at (недавно)
```

## Типичные проблемы и решения

### Проблема: `auth-init-v2` возвращает пустое тело

**Причина:** Поток не дошел до Respond-ноды или Respond настроен неправильно

**Решение:**
1. Проверить Execution Log в n8n
2. Убедиться, что "Respond to Webhook" имеет:
   - `respondWith: "json"`
   - `responseBody: "={{ $json }}"`
3. Проверить, что цепочка Build Response → Debug Before Respond → Respond to Webhook соединена

### Проблема: `chat-create` возвращает 401

**Причина:** Токен не доходит до n8n или невалидный

**Решение:**
1. Проверить, что токен сохранен в `localStorage`
2. Проверить, что токен передается в:
   - Query параметре (`?token=...`)
   - Body (`session_token: ...`)
   - Header (`Authorization: Bearer ...`) - если не закомментирован
3. Проверить в Execution Log, что токен извлекается в ноде "Extract Token"
4. Проверить в БД, что токен существует и не просрочен

### Проблема: CORS ошибка в браузере

**Причина:** Nginx или n8n не возвращает CORS заголовки

**Решение:**
1. Проверить `N8N_CORS_ORIGIN` в docker-compose.yml
2. Проверить nginx конфиг для `/webhook/` endpoints
3. Убедиться, что OPTIONS запросы обрабатываются правильно

### Проблема: Токен не сохраняется на фронте

**Причина:** `auth-init-v2` возвращает пустое тело или неправильную структуру

**Решение:**
1. Проверить ответ `auth-init-v2` в Network
2. Убедиться, что структура: `{ success: true, data: { session_token: "..." } }`
3. Проверить код в `authInit` функции - правильно ли извлекается токен

## Файлы для проверки

### Backend (n8n workflows)
- `back/n8n/workflows/auth.init.v3.json` - должен возвращать JSON с `session_token`
- `back/n8n/workflows/auth.validate.v3.json` - должен валидировать токен
- `back/n8n/workflows/chat.create.json` - должен извлекать токен из query/body/header

### Frontend
- `src/utils/api.ts` - функции `authInit` и `createChat`
- `front/VoiceAssistantPage.tsx` - функция `createChatDirect`
- `src/components/AuthGuard.tsx` - инициализация сессии

### Конфигурация
- `back/docker-compose.yml` - переменная `N8N_CORS_ORIGIN`
- Nginx конфиги на сервере - CORS заголовки для `/webhook/`

## Быстрый тест всей цепочки

```bash
# 1. Получить токен
TOKEN=$(curl -s -X POST https://n8n.psayha.ru/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{"initData":"query_id=test&user=%7B%22id%22%3A123%7D","appVersion":"1.0.0"}' \
  | jq -r '.data.session_token')

echo "Token: $TOKEN"

# 2. Валидировать токен
curl -X POST https://n8n.psayha.ru/webhook/auth-validate-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"token\":\"$TOKEN\"}"

# 3. Создать чат
curl -X POST "https://n8n.psayha.ru/webhook/chat-create?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Chat\",\"session_token\":\"$TOKEN\"}"
```

Если все три команды возвращают успешные ответы - цепочка работает! ✅

