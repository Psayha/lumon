# 🔧 Исправление: Ошибка парсинга Telegram initData

## Проблема

В n8n executions появлялись ошибки:

```
Error: Invalid Telegram initData: Unexpected end of JSON input [Line 35]
```

**Последствия:**
- Некоторые запросы auth-init падали с ошибкой
- Workflow не возвращал корректный ответ клиенту
- Клиент не получал token
- В модалке истории писало "не авторизован"

---

## Причина

В функции "Parse Telegram initData" отсутствовала валидация пустых значений:

```javascript
// СТАРЫЙ КОД (неправильно):
const userStr = decodeURIComponent(params.user || '');
const user = JSON.parse(userStr);  // ❌ Падает если userStr пустая строка
```

Когда `params.user` был undefined или пустой строкой, `JSON.parse('')` бросал ошибку "Unexpected end of JSON input".

**Дополнительная проблема:** При ошибке workflow просто останавливался и не возвращал ответ клиенту.

---

## Решение ✅

### 1. Добавлена валидация на каждом этапе парсинга

```javascript
// НОВЫЙ КОД (правильно):

// Проверка что initData не пустой
if (!initData || initData.trim().length === 0) {
  return { json: { error: true, message: 'initData is empty', status: 400 } };
}

// Проверка что user параметр существует
if (!params.user) {
  return { json: { error: true, message: 'user parameter missing', status: 400 } };
}

// Проверка что userStr не пустой после decode
const userStr = decodeURIComponent(params.user);
if (!userStr || userStr.trim().length === 0) {
  return { json: { error: true, message: 'user parameter is empty', status: 400 } };
}

// Безопасный парсинг JSON
let user;
try {
  user = JSON.parse(userStr);
} catch (parseError) {
  return { json: { error: true, message: 'Failed to parse user JSON', status: 400 } };
}

// Проверка что user.id существует
if (!user || !user.id) {
  return { json: { error: true, message: 'user.id is missing', status: 400 } };
}
```

### 2. Добавлен flow обработки ошибок

**Новые ноды:**
- **IF Parse Error** - проверяет поле `error` в результате парсинга
- **Format Parse Error** - форматирует ошибку в правильный формат
- **Respond Error** - возвращает HTTP 400 с описанием ошибки

**Новый flow:**
```
Parse Telegram initData
  ↓
IF Parse Error?
  ├─ YES (error=true) → Format Parse Error → Respond Error (400)
  └─ NO (error=false) → Upsert User → ... → Success
```

---

## Изменения в workflow

### Добавлены ноды:

1. **IF Parse Error** (новая)
   - Позиция: [550, 300]
   - Проверяет: `$json.error === true`

2. **Format Parse Error** (новая)
   - Позиция: [650, 200]
   - Форматирует ошибку в стандартный формат:
     ```json
     {
       "success": false,
       "error": "invalid_init_data",
       "message": "...",
       "status": 400
     }
     ```

### Обновлены connections:

```json
{
  "Parse Telegram initData": {
    "main": [["IF Parse Error"]]  // ← Изменено с "Upsert User"
  },
  "IF Parse Error": {
    "main": [
      ["Format Parse Error"],  // TRUE path (error=true)
      ["Upsert User"]          // FALSE path (error=false)
    ]
  },
  "Format Parse Error": {
    "main": [["Respond Error"]]  // ← Новое
  }
}
```

---

## Как применить исправление

### Переимпорт workflow (рекомендуется)

1. **Откройте n8n UI:** https://n8n.psayha.ru

2. **Деактивируйте старый:**
   ```
   Workflows → auth.init → Toggle OFF
   ```

3. **Удалите старый (опционально):**
   ```
   Workflows → auth.init → Delete
   ```

4. **Импортируйте обновленный:**
   ```
   Workflows → Import from File
   → Выберите: back/n8n/workflows/auth.init.v3.json
   → Настройте PostgreSQL credentials
   → Активируйте (toggle ON)
   ```

---

## Тестирование

### 1. Проверка корректного initData

**Запрос:**
```bash
curl -X POST https://n8n.psayha.ru/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "user=%7B%22id%22%3A887567962%2C%22first_name%22%3A%22Test%22%7D&auth_date=1762803482",
    "appVersion": "1.0.0"
  }'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "session_token": "uuid-here",
    "user": {
      "id": "uuid",
      "role": "viewer",
      "company_id": null
    }
  }
}
```
**Статус:** 200 OK ✅

---

### 2. Проверка пустого initData

**Запрос:**
```bash
curl -X POST https://n8n.psayha.ru/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "",
    "appVersion": "1.0.0"
  }'
```

**Ожидаемый результат:**
```json
{
  "success": false,
  "error": "invalid_init_data",
  "message": "initData is empty or missing",
  "status": 400
}
```
**Статус:** 400 Bad Request ✅

---

### 3. Проверка невалидного user JSON

**Запрос:**
```bash
curl -X POST https://n8n.psayha.ru/webhook/auth-init-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "user=%7Binvalid&auth_date=1762803482",
    "appVersion": "1.0.0"
  }'
```

**Ожидаемый результат:**
```json
{
  "success": false,
  "error": "invalid_init_data",
  "message": "Failed to parse user JSON: ...",
  "status": 400
}
```
**Статус:** 400 Bad Request ✅

---

## Проверка в n8n Executions

1. **Откройте:** https://n8n.psayha.ru/executions

2. **Найдите последние executions "auth.init"**

3. **Проверьте что:**
   - ✅ Успешные executions проходят до конца
   - ✅ Ошибочные executions останавливаются на "Format Parse Error"
   - ✅ Нет "workflow stopped without response"

4. **Кликните на failed execution:**
   - Должны видеть красную ноду "Format Parse Error"
   - В output должна быть ошибка с описанием проблемы

---

## Ожидаемые результаты

### До исправления:
```
❌ Invalid initData → Workflow stops with error
❌ No response to client
❌ "[Unable to read response body]"
❌ Token не сохраняется
❌ Модалка истории: "не авторизован"
```

### После исправления:
```
✅ Invalid initData → HTTP 400 with error description
✅ Client receives proper error response
✅ Valid initData → HTTP 200 with session_token
✅ Token сохраняется в localStorage
✅ Модалка истории работает корректно
```

---

## Типы ошибок валидации

Теперь workflow распознает и правильно обрабатывает:

| Ошибка | Сообщение | HTTP Code |
|--------|-----------|-----------|
| Пустой initData | "initData is empty or missing" | 400 |
| Отсутствует user | "user parameter is missing in initData" | 400 |
| Пустой user после decode | "user parameter is empty after decoding" | 400 |
| Невалидный JSON | "Failed to parse user JSON: ..." | 400 |
| Отсутствует user.id | "user object is missing required id field" | 400 |
| Неожиданная ошибка | "Unexpected error: ..." | 500 |

---

## Связанные исправления

- ✅ `AUTH_INIT_RESPONSE_FIX.md` - Исправление формата ответа (text вместо json)
- ✅ `HTTP_REQUEST_RESPONSE_FORMAT_FIX.md` - Общие проблемы с responseFormat

---

## Коммиты

| Дата | Коммит | Описание |
|------|--------|----------|
| 2025-11-10 | `ec5765b` | Добавлена валидация для парсинга |
| 2025-11-10 | `0efd5ec` | Добавлена обработка ошибок с правильным ответом |

---

**Последнее обновление:** 2025-11-10
**Коммит:** `0efd5ec`
**Статус:** ✅ Исправлено и готово к импорту
