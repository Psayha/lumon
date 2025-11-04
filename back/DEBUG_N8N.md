# 🐛 Отладка n8n workflows

## Текущая проблема: Error 500 в auth-validate

### Шаг 1: Проверь логи n8n

```bash
ssh root@91.229.10.47
cd /путь/к/back
docker-compose logs -f n8n --tail=100
```

Ищи строки с ошибками (ERROR, FAILED, Exception).

---

### Шаг 2: Импортируй упрощённый workflow для теста

1. Открой n8n: `http://91.229.10.47:5678`
2. **Settings** → **Import from File**
3. Выбери: `back/n8n/workflows/auth.validate.simple.json`
4. **Activate** workflow

Этот workflow просто возвращает mock данные без обращения к БД.

---

### Шаг 3: Протестируй упрощённый workflow

В ApiTestPage:
1. Выбери "Auth Validate"
2. В body оставь: `{ "token": "test-token" }`
3. Нажми **"Тестировать POST"**

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "Workflow works!",
  "receivedToken": "test-token",
  "context": {
    "userId": "test-user-id",
    "role": "owner",
    "companyId": "test-company-id",
    "permissions": ["read", "write", "delete"]
  },
  "traceId": "..."
}
```

---

### Шаг 4: Если простой workflow работает

Значит проблема в PostgreSQL запросах. Проверь:

#### 4.1 PostgreSQL Credentials
1. В n8n → **Credentials** (внизу слева)
2. Найди **"Supabase PostgreSQL"**
3. Проверь:
   - Host: `supabase-db` (имя Docker контейнера)
   - Database: `lumon`
   - User: `postgres`
   - Password: из `.env` (по умолчанию `lumon_dev_password`)
   - Port: `5432`
   - SSL: `allow`

#### 4.2 Тест подключения к БД
```bash
# На сервере
docker exec -it lumon-supabase-db psql -U postgres -d lumon -c "SELECT 1;"
```

Должно вернуть:
```
 ?column? 
----------
        1
(1 row)
```

#### 4.3 Проверь что таблица sessions существует
```bash
docker exec -it lumon-supabase-db psql -U postgres -d lumon -c "\dt sessions"
```

Должно показать таблицу `sessions`.

---

### Шаг 5: Если простой workflow НЕ работает

Проблема в nginx или n8n. Проверь:

#### 5.1 n8n доступен напрямую
```bash
curl http://91.229.10.47:5678
```

Должен вернуть HTML страницу n8n.

#### 5.2 Webhook доступен
```bash
curl -X POST http://91.229.10.47:5678/webhook/auth-validate \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
```

#### 5.3 Nginx конфиг
```bash
cat /etc/nginx/sites-enabled/default | grep n8n
```

Должен быть блок:
```nginx
location /webhook/ {
    proxy_pass http://localhost:5678/webhook/;
    ...
}
```

---

### Шаг 6: Проверь статус workflow в n8n

1. Открой n8n
2. Найди workflow "auth.validate" или "auth.validate.simple"
3. Кликни на него
4. Проверь:
   - ✅ **Активирован** (зелёный toggle вверху справа)
   - Webhook path: `auth-validate`
   - Response mode: `responseNode`

---

### Шаг 7: Ручной тест в n8n

1. Открой workflow "auth.validate.simple"
2. Нажми **"Execute Workflow"** (справа вверху)
3. В окне "Webhook" введи:
   ```json
   {
     "token": "test-token-123"
   }
   ```
4. Нажми **"Send Request"**

Если здесь работает, но через ApiTestPage нет — проблема в nginx или CORS.

---

### Шаг 8: CORS проблемы

Если видишь ошибки CORS в консоли браузера (F12), обнови nginx конфиг:

```nginx
location /webhook/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
        return 204;
    }

    add_header 'Access-Control-Allow-Origin' '*';
    proxy_pass http://localhost:5678/webhook/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Перезапусти nginx:
```bash
sudo nginx -t && sudo nginx -s reload
```

---

## 🔍 Частые проблемы

### ❌ "Error in workflow"
- PostgreSQL credentials неправильные
- Таблица не создана (не применена миграция)
- Синтаксическая ошибка в SQL запросе

### ❌ "Workflow not found"
- Workflow не активирован
- Неправильный webhook path

### ❌ "Connection refused"
- n8n контейнер не запущен: `docker ps | grep n8n`
- Nginx не проксирует запросы

### ❌ CORS ошибки
- Nginx не настроен для CORS
- Нет OPTIONS handler

---

## ✅ Checklist

- [ ] n8n контейнер запущен
- [ ] Supabase контейнер запущен
- [ ] SQL миграция применена
- [ ] PostgreSQL credentials настроены в n8n
- [ ] Workflow импортирован
- [ ] Workflow активирован
- [ ] Nginx проксирует `/webhook/`
- [ ] CORS настроен в nginx
- [ ] Простой workflow работает
- [ ] БД доступна из n8n контейнера

---

**После каждого шага отправляй мне логи/результаты!** 🚀

