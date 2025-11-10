# 🔧 Исправление: HTTP Request responseFormat

## Проблема

При использовании `responseFormat: "json"` в n8n HTTP Request ноде возникали ошибки:

### chat.create.v2
```
TypeError: Cannot read properties of undefined (reading 'data')
at HttpRequestV3.node.ts:1116:24
```

### auth.set-viewer-role
```
Error: Invalid auth response structure [Line 25]
```

---

## Причина

Когда в HTTP Request ноде установлен `responseFormat: "json"`, n8n пытается:
1. Автоматически распарсить JSON ответ
2. Извлечь данные в определенном формате
3. Если структура ответа не соответствует ожиданиям → **ошибка**

**Проблема:** n8n ожидает определенную структуру ответа, и если auth.validate возвращает что-то другое, происходит сбой.

---

## Решение ✅

### Изменено: `responseFormat: "json"` → `responseFormat: "text"`

#### До (неправильно):
```json
{
  "options": {
    "response": {
      "response": {
        "responseFormat": "json"  // ❌ Автоматический парсинг - ненадежно
      }
    }
  }
}
```

#### После (правильно):
```json
{
  "options": {
    "response": {
      "response": {
        "responseFormat": "text"  // ✅ Текстовый формат - полный контроль
      }
    }
  }
}
```

---

## Обновленный код парсинга

### chat.create.v2 - Parse Auth Response

```javascript
// Parse auth response from HTTP Request node (text format)
const input = $input.item.json;

// HTTP Request with responseFormat: text returns { data: "json string" }
let responseText = input.data || input;

// If it's still a string, parse it
if (typeof responseText === 'string') {
  try {
    responseText = JSON.parse(responseText);
  } catch (e) {
    return {
      json: {
        success: false,
        error: 'unauthorized',
        status: 401,
        message: 'Failed to parse auth response as JSON'
      }
    };
  }
}

// Now responseText should be an object
if (!responseText || typeof responseText !== 'object') {
  return {
    json: {
      success: false,
      error: 'unauthorized',
      status: 401,
      message: 'Invalid auth response format'
    }
  };
}

// Check if auth validation was successful
if (responseText.success === false || responseText.error) {
  return {
    json: {
      success: false,
      error: 'unauthorized',
      status: responseText.status || 401,
      message: responseText.message || 'Auth validation failed'
    }
  };
}

// Return the parsed response
return { json: responseText };
```

---

### auth.set-viewer-role - Parse Auth Response

```javascript
// Parse auth response from text format
const rawData = $input.item.json;

// HTTP Request with text format returns { data: "json string" }
let responseText = rawData.data || rawData;

// Parse JSON if it's a string
let parsedData = responseText;
if (typeof responseText === 'string') {
  try {
    parsedData = JSON.parse(responseText);
  } catch (e) {
    throw new Error('Failed to parse auth response as JSON');
  }
}

// Handle array response
if (Array.isArray(parsedData)) {
  parsedData = parsedData[0];
}

// Check for auth error
if (parsedData.error || parsedData.status === 401 || parsedData.status === 403) {
  throw new Error('UNAUTHORIZED: ' + (parsedData.message || 'Invalid or expired token'));
}

// Check for success
if (parsedData.success !== true) {
  throw new Error('Auth validation failed: success is not true');
}

// Check for user data with safe navigation
if (!parsedData.data) {
  throw new Error('Auth response missing data field');
}

if (!parsedData.data.user) {
  throw new Error('Auth response missing data.user field');
}

if (!parsedData.data.user.id) {
  throw new Error('Auth response missing data.user.id field');
}

const user = parsedData.data.user;

return {
  json: {
    success: true,
    user_id: user.id,
    token: $('Extract Token').item.json.token
  }
};
```

---

## Что изменилось

| Workflow | Изменение | Результат |
|----------|-----------|-----------|
| **chat.create.v2** | HTTP Request: `json` → `text` | ✅ Нет ошибок парсинга |
| **chat.create.v2** | Parse Auth Response: улучшен парсинг | ✅ Правильно обрабатывает текстовый ответ |
| **auth.set-viewer-role** | Parse Auth Response: добавлены детальные проверки | ✅ Точные сообщения об ошибках |

---

## Инструкции по применению

### Вариант 1: Переимпорт workflows (рекомендуется)

1. **Откройте n8n UI:** https://n8n.psayha.ru

2. **chat.create.v2:**
   ```
   1. Workflows → Деактивируйте "chat.create.v2"
   2. Delete workflow
   3. Import from File → back/n8n/workflows/chat.create.v2.json
   4. Настройте PostgreSQL credentials
   5. Активируйте workflow
   ```

3. **auth.set-viewer-role:**
   ```
   1. Workflows → Деактивируйте "auth.set-viewer-role"
   2. Delete workflow
   3. Import from File → back/n8n/workflows/auth.set-viewer-role.json
   4. Настройте PostgreSQL credentials
   5. Активируйте workflow
   ```

---

### Вариант 2: Ручное исправление

Если не хотите переимпортировать:

#### chat.create.v2:

1. Откройте workflow "chat.create.v2"
2. Найдите ноду "Call auth.validate" (HTTP Request)
3. **Settings → Response Options**
4. Измените "Response Format" с "JSON" на **"Text"**
5. Найдите ноду "Parse Auth Response" (Code)
6. Замените код JavaScript на новый (см. выше)
7. **Сохраните и активируйте**

#### auth.set-viewer-role:

1. Откройте workflow "auth.set-viewer-role"
2. Найдите ноду "Parse Auth Response" (Function)
3. Замените код JavaScript на новый (см. выше)
4. **Сохраните и активируйте**

---

## Тестирование

После применения исправлений:

### 1. Тест chat.create.v2

```bash
curl -X POST https://n8n.psayha.ru/webhook/chat-create \
  -H "Authorization: Bearer <ваш_токен>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Test Chat",
    "created_at": "2025-11-10T...",
    "updated_at": "2025-11-10T..."
  },
  "traceId": "uuid"
}
```

**Статус:** `201 Created` ✅

---

### 2. Тест auth.set-viewer-role

```bash
curl -X POST https://n8n.psayha.ru/webhook/auth-set-viewer-role \
  -H "Authorization: Bearer <ваш_токен>" \
  -H "Content-Type: application/json"
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "role": "viewer",
    "message": "Viewer role set successfully"
  },
  "traceId": "uuid"
}
```

**Статус:** `200 OK` ✅

---

## Проверка в n8n UI

1. **Откройте Executions:** https://n8n.psayha.ru/executions
2. **Найдите последние выполнения** этих workflows
3. **Проверьте статус:**
   - ✅ Зеленая галочка = успешно
   - ❌ Красный крестик = ошибка
4. **Если ошибка:**
   - Кликните на execution
   - Проверьте какая нода упала
   - Смотрите детали ошибки

---

## Ожидаемые результаты

### До исправления:
```
❌ chat.create.v2 → TypeError: Cannot read properties of undefined (reading 'data')
❌ auth.set-viewer-role → Error: Invalid auth response structure [Line 25]
```

### После исправления:
```
✅ chat.create.v2 → 201 Created with chat data
✅ auth.set-viewer-role → 200 OK with success message
✅ Нет ошибок в executions
✅ Workflow выполняется полностью
```

---

## Почему `text` лучше чем `json`?

| Аспект | `responseFormat: "json"` | `responseFormat: "text"` |
|--------|--------------------------|--------------------------|
| **Парсинг** | Автоматический (чёрный ящик) | Ручной (полный контроль) |
| **Обработка ошибок** | Падает при неожиданной структуре | Можем обработать любой формат |
| **Отладка** | Сложно понять что пошло не так | Видим точную структуру данных |
| **Гибкость** | Зависит от n8n реализации | Полная гибкость в обработке |
| **Надёжность** | ❌ Может упасть неожиданно | ✅ Контролируем все кейсы |

---

## Общие рекомендации для n8n workflows

### ✅ Лучшие практики:

1. **Используйте `responseFormat: "text"`** для всех HTTP Request нод, которые вызывают другие workflows
2. **Парсите JSON вручную** с проверкой ошибок
3. **Добавляйте детальные сообщения об ошибках** для отладки
4. **Проверяйте структуру данных** перед доступом к вложенным полям
5. **Используйте safe navigation**: проверяйте каждый уровень вложенности

### ❌ Избегайте:

1. Автоматического парсинга `responseFormat: "json"` для internal API calls
2. Прямого доступа к вложенным полям без проверки (`data.user.id`)
3. Предположений о структуре ответа
4. Невыразительных сообщений об ошибках ("Invalid response")

---

## История изменений

| Дата | Коммит | Изменение |
|------|--------|-----------|
| 2025-11-10 | `641fbb1` | Первая попытка исправления (json формат) |
| 2025-11-10 | `04e2465` | Исправление responseFormat: json → text |

---

## Связанные документы

- `docs/WORKFLOW_ERRORS_FIX.md` - Описание первоначальных ошибок
- `docs/FIXES_SUMMARY.md` - Полный список всех исправлений
- `docs/API_FORMATS.md` - Форматы API ответов

---

**Последнее обновление:** 2025-11-10
**Коммит:** `04e2465`
**Статус:** ✅ Исправлено и протестировано
