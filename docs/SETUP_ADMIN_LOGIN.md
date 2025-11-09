# Настройка админ-логина

## Шаги на сервере

### 1. Применить миграцию

```bash
cd /var/www/back
docker compose exec supabase-db psql -U postgres -d lumon -f /docker-entrypoint-initdb.d/20251106000000_admin_users.sql
```

Или через Supabase Studio (http://localhost:3001):
- Открыть SQL Editor
- Скопировать содержимое `back/supabase/migrations/20251106000000_admin_users.sql`
- Выполнить

### 2. Создать первого админа

```bash
cd /var/www/back
docker compose exec supabase-db psql -U postgres -d lumon
```

В psql выполнить:

```sql
-- Вставить первого админа (username: admin, password: admin)
-- ВАЖНО: В production замените пароль на безопасный!
INSERT INTO admin_users (username, password_hash, is_active)
VALUES ('admin', 'admin', true);
```

**Для production:** Используйте bcrypt для хеширования паролей:
```sql
-- Пример с bcrypt (требует расширения pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO admin_users (username, password_hash, is_active)
VALUES ('admin', crypt('your_secure_password', gen_salt('bf')), true);
```

### 3. Импортировать workflow в n8n

1. Открыть n8n: https://n8n.psayha.ru
2. Settings → Import from File
3. Выбрать файл: `back/n8n/workflows/admin.login.json`
4. Активировать workflow

### 4. Проверить работу

1. Открыть админ-панель: https://admin.psayha.ru
2. Войти с учетными данными из шага 2
3. Проверить, что токен сохраняется и работает

## Структура

- **admin_users** - таблица администраторов
- **admin_sessions** - сессии администраторов (токены)
- **admin.login** - n8n workflow для `/webhook/admin-login`

## Безопасность

⚠️ **ВАЖНО:** В текущей версии пароли хранятся в открытом виде. Для production:
1. Добавить bcrypt хеширование в workflow
2. Использовать HTTPS
3. Настроить rate limiting для `/webhook/admin-login`
4. Добавить 2FA (опционально)

