# Исправление ошибок с metadata

## Проблемы, которые были обнаружены:

1. **500 Error в `/webhook/chat-save-message`** - таблица `messages` не имела колонки `metadata`, которую использует TypeORM entity
2. **400 Error в `/webhook/analytics-log-event`** - ошибка "Cannot read properties of undefined (reading 'length')" в валидаторе JSONB

## Исправления

### 1. Исправлен JSONB валидатор (✅ Готово)
Файл: `back/api/src/common/validators/jsonb-validator.ts`
- Добавлена проверка на undefined для `allowedKeys`
- Это исправляет 400 ошибку в analytics

### 2. Добавлена миграция для колонки metadata (⚠️ Требует применения)
Файл: `base/supabase/migrations/002_add_metadata_to_messages.sql`

## Как применить миграцию на сервере:

### Вариант 1: Через SSH на сервере

```bash
# 1. Подключитесь к серверу
ssh root@91.229.10.47

# 2. Создайте файл миграции
cat > /tmp/002_add_metadata_to_messages.sql << 'EOF'
-- Add metadata column to messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin(metadata);
EOF

# 3. Применить миграцию
docker exec -i lumon-supabase-db psql -U postgres -d lumon < /tmp/002_add_metadata_to_messages.sql

# 4. Проверить, что колонка добавлена
docker exec -i lumon-supabase-db psql -U postgres -d lumon -c "\d messages"

# 5. Очистить временный файл
rm /tmp/002_add_metadata_to_messages.sql

# 6. Перезапустить API (если используется PM2)
cd /path/to/lumon/back/api && pm2 restart lumon-api
```

### Вариант 2: Через Supabase Dashboard

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Выполните следующий SQL:

```sql
-- Add metadata column to messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin(metadata);
```

4. После применения миграции перезапустите API сервис

## Проверка

После применения миграции и перезапуска API, проверьте:

```bash
# Проверить структуру таблицы
docker exec -i lumon-supabase-db psql -U postgres -d lumon -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'messages' AND column_name IN ('metadata', 'attachments') ORDER BY column_name;"

# Проверить логи API
pm2 logs lumon-api --lines 50
```

## Что дальше

После применения обеих исправлений:
1. Ошибка 500 в `/webhook/chat-save-message` должна исчезнуть
2. Ошибка 400 в `/webhook/analytics-log-event` должна исчезнуть
3. Сообщения будут сохраняться корректно

Если ошибки продолжают возникать, проверьте логи API для получения дополнительной информации.
