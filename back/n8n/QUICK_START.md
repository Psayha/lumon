# ⚡ Быстрый старт n8n Workflows

## 📥 Импорт (2 минуты)

### 1. Откройте n8n
http://localhost:5678 (admin / lumon_dev)

### 2. Создайте PostgreSQL Credential (один раз)

**Settings → Credentials → New → PostgreSQL**

```
Name: Lumon PostgreSQL
Host: supabase-db
Port: 5432
Database: lumon
User: postgres
Password: lumon_dev_password
SSL: false
```

### 3. Импортируйте ВСЕ 5 workflows

**Workflows → Import from File → Выберите:**

1. ✅ `save-message.json`
2. ✅ `get-chat-history.json`
3. ✅ `create-user.json`
4. ✅ `create-chat.json`
5. ✅ `analytics.json`

### 4. Обновите Credentials в каждом workflow

Откройте каждый workflow → В каждом **PostgreSQL node** → Выберите `Lumon PostgreSQL`

### 5. Активируйте все workflows

Переключатель **Active = ON** в каждом workflow

## ✅ Готово!

Теперь frontend автоматически будет сохранять все данные в PostgreSQL.

## 🧪 Проверка

Откройте VoiceAssistantPage - все должно работать автоматически!

