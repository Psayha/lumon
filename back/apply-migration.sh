#!/bin/bash
# Скрипт для применения миграции на сервере

SERVER_IP="91.229.10.47"
SERVER_USER="root"  # Или твой пользователь на сервере

echo "🚀 Загружаем миграции на сервер..."

# Загружаем файлы миграций на сервер
scp supabase/migrations/20251104000000_drop_old_tables.sql ${SERVER_USER}@${SERVER_IP}:/tmp/
scp supabase/migrations/20251104000001_auth_system.sql ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "✅ Файлы загружены"
echo "📝 Применяем миграции..."

# Применяем миграции через Docker
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
  echo "1️⃣ Удаляем старые таблицы..."
  docker exec -i lumon-supabase-db psql -U postgres -d lumon < /tmp/20251104000000_drop_old_tables.sql
  
  echo "2️⃣ Создаём новые таблицы..."
  docker exec -i lumon-supabase-db psql -U postgres -d lumon < /tmp/20251104000001_auth_system.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Миграции применены успешно!"
    
    echo ""
    echo "📊 Проверяем созданные таблицы..."
    docker exec -i lumon-supabase-db psql -U postgres -d lumon << SQL
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'companies', 'users', 'user_companies', 
        'sessions', 'chats', 'messages', 
        'audit_events', 'idempotency_keys', 'rate_limits'
      )
    ORDER BY table_name;
SQL
  else
    echo "❌ Ошибка при применении миграции"
    exit 1
  fi
  
  # Удаляем временные файлы
  rm /tmp/20251104000000_drop_old_tables.sql
  rm /tmp/20251104000001_auth_system.sql
EOF

echo ""
echo "✨ Готово!"

