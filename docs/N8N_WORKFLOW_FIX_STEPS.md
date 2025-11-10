# 🔧 Исправление n8n Workflows: Пошаговая инструкция

## 🎯 Цель
Исправить ошибку 401 с пустым body в `chat.create` workflow

## 📍 Где исправлять
https://n8n.psayha.ru → Workflows → `chat.create`

---

## ✅ Шаг 1: Добавить проверку после Parse Auth Response

### 1.1 Открыть workflow
1. Зайти на https://n8n.psayha.ru
2. Найти workflow `chat.create`
3. Нажать "Edit"

### 1.2 Найти узел "Parse Auth Response"
- Он находится после "Call auth.validate"
- Position: [1050, 500]

### 1.3 Добавить IF узел
1. Кликнуть на "Parse Auth Response"
2. Нажать "+" (добавить узел)
3. Выбрать "If" из списка
4. Назвать узел: **"IF Auth Success"**

### 1.4 Настроить условие

**В узле "IF Auth Success":**

**Conditions:**
- **Field:** `{{ $json.success }}`
- **Operation:** `equals`
- **Value:** `true` (Boolean)

**И добавить второе условие (AND):**
- **Field:** `{{ $json.error }}`
- **Operation:** `isEmpty`

### 1.5 Переподключить узлы

**TRUE path (успех):**
```
Parse Auth Response → IF Auth Success (TRUE) → Call Rate Limit → ...
```

**FALSE path (ошибка):**
```
Parse Auth Response → IF Auth Success (FALSE) → Respond Auth Error
```

---

## 🔧 Шаг 2: Исправить "Respond Auth Error"

### 2.1 Найти узел "Respond Auth Error"
- Position: [1650, 400]

### 2.2 Проверить настройки

**Параметры должны быть:**
```
Response Mode: JSON (не text!)
Response Body: {{ $json }}
Response Code: {{ $json.status || 401 }}
```

---

## 🔧 Шаг 3: Упростить Extract Token (опционально)

Если проблемы продолжаются, упростить извлечение токена:

### 3.1 В узле "Extract Token"
Заменить весь jsCode на:

```javascript
const input = $input.item.json;
const headers = input.headers || {};

// Получаем токен из Authorization header
const authHeader = headers.authorization || headers.Authorization || '';

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return {
    json: {
      error: 'unauthorized',
      status: 401,
      message: 'Missing Authorization header'
    }
  };
}

const token = authHeader.replace('Bearer ', '').trim();
const body = input.body || input;
const title = body.title || 'New Chat';

return {
  json: {
    token: token,
    title: title
  }
};
```

---

## ✅ Шаг 4: Сохранить и протестировать

1. **Save** workflow
2. **Activate** workflow
3. Протестировать через frontend или ApiTestPage

---

## 📊 Ожидаемый результат

**До исправления:**
```
POST /webhook/chat-create → 401
Body: {}
```

**После исправления:**
```
POST /webhook/chat-create → 401
Body: {
  "success": false,
  "error": "unauthorized",
  "status": 401,
  "message": "Invalid or expired token"
}
```

или

```
POST /webhook/chat-create → 201
Body: {
  "success": true,
  "data": {
    "id": "chat-uuid",
    "title": "Test Chat",
    ...
  }
}
```

---

## 🆘 Если не помогло

Проверьте в n8n **Executions** (история выполнений):
1. Найдите последний failed execution для chat.create
2. Посмотрите на каком узле произошла ошибка
3. Проверьте данные на входе и выходе этого узла

---

## 🚀 Альтернатива: Импорт нового workflow

Если ручное исправление сложно, можно импортировать готовый исправленный workflow.

Для этого:
1. Экспортируйте текущий chat.create (для backup)
2. Деактивируйте его
3. Импортируйте новый исправленный файл
4. Активируйте новый workflow
