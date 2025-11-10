# План исправления n8n Workflows

## 🔴 Проблема

Frontend отправляет правильный запрос к `/webhook/chat-create`:
```
Authorization: Bearer 469e6f83-d3b0-4bfc-bad7-11fd30e81290
Body: {"title":"Test Chat","session_token":"469e6f83-d3b0-4bfc-bad7-11fd30e81290"}
```

Но получает ответ:
```
HTTP 401
Body: {}  ← Пустой!
```

## 🔍 Причина

В `chat.create.json`:
1. "Parse Auth Response" может вернуть ошибку с `success: false`
2. Сразу после этого вызывается "Call Rate Limit"
3. Rate Limit пытается получить `$('Parse Auth Response').item.json.data.user.id`
4. Но если auth failed, то `data.user` не существует!
5. Происходит ошибка и workflow возвращает пустой `{}`

## ✅ Решение

### Вариант 1: Добавить проверку после Parse Auth Response

После "Parse Auth Response" добавить IF узел:
- **Условие:** `$json.success === true`
- **True path:** Call Rate Limit → Create Chat
- **False path:** Respond Auth Error

### Вариант 2: Упростить весь workflow

Убрать сложную логику извлечения токена, использовать только Authorization header.

## 📝 Рекомендуемая структура

```
Webhook Trigger
  ↓
Extract Token (только из Authorization header)
  ↓
IF Token Exists?
  ↓ Yes
Call auth.validate
  ↓
Parse Auth Response
  ↓
IF Auth Success?
  ↓ Yes
Call Rate Limit
  ↓
IF Rate Limit OK?
  ↓ Yes
Create Chat in DB
  ↓
Build Response
  ↓
Respond Success

(все No paths → Respond Error)
```

## 🚀 Что делать

1. Зайти в n8n UI (https://n8n.psayha.ru)
2. Открыть workflow `chat.create`
3. Добавить IF узел после "Parse Auth Response"
4. Настроить условие: `{{ $json.success }} equals true`
5. Подключить правильные пути
6. Сохранить и активировать

## 📦 Альтернатива: Загрузить исправленный JSON

Я могу создать исправленную версию chat.create.json и вы сможете импортировать её в n8n.
