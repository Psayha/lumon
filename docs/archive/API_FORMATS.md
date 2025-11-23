# API Форматы для n8n workflows

## ✅ Правильные форматы ответов

### auth-validate Response Format
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "telegram_id": 123456789,
      "first_name": "Name",
      "last_name": "Last",
      "username": "username",
      "role": "owner|manager|viewer",
      "company_id": "uuid",
      "company_name": "Company Name",
      "permissions": ["read", "write", ...]
    },
    "session": {
      "expires_at": "2025-11-17T...",
      "last_activity_at": "2025-11-10T..."
    }
  }
}
```

### chat-create Expected Data Access
В `chat.create.json` после вызова `auth.validate`:
- User ID: `$('Parse Auth Response').item.json.data.user.id`
- Company ID: `$('Parse Auth Response').item.json.data.user.company_id`
- Role: `$('Parse Auth Response').item.json.data.user.role`

## ⚠️ Проблема: company_id доступ

В `auth.validate` возвращается:
```javascript
data: {
  user: {
    company_id: session.company_id  // ✅ Правильно
  }
}
```

В `chat.create` используется:
```javascript
const companyId = authData?.data?.user?.company_id  // ✅ Правильный путь
```

## 🔍 Дебаг логи из frontend

При ошибке 401 в chat-create:
```
POST https://n8n.psayha.ru/webhook/chat-create → 401
body: {}  // ← Пустой body = где-то не вернулся ответ
```

## 💡 Решение

### 1. Убедиться что все Respond nodes используют правильный формат:

```json
{
  "parameters": {
    "respondWith": "json",  // ← НЕ "text"!
    "responseBody": "={{ $json }}",
    "options": {
      "responseCode": "={{ $json.status || 401 }}"
    }
  }
}
```

### 2. В Parse Auth Response убедиться что возвращается правильный объект:

```javascript
// Если ответ валидный:
return { json: parsedData };

// Если ошибка:
return {
  json: {
    success: false,
    error: 'unauthorized',
    status: 401,
    message: 'Description'
  }
};
```

### 3. Frontend должен отправлять токен в Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

НЕ нужно дублировать в body.session_token!
