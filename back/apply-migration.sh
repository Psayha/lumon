#!/bin/bash
# Скрипт для применения миграции на сервере

SERVER_IP="91.229.10.47"
SERVER_USER="root"  # Или твой пользователь на сервере

echo "🚀 Загружаем миграцию на сервер..."

# Загружаем файл миграции на сервер
scp supabase/migrations/20251104000001_auth_system.sql ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "✅ Файл загружен"
echo "📝 Применяем миграцию..."

# Применяем миграцию через Docker
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
  docker exec -i lumon-supabase-db psql -U postgres -d lumon < /tmp/20251104000001_auth_system.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Миграция применена успешно!"
    
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
  
  # Удаляем временный файл
  rm /tmp/20251104000001_auth_system.sql
EOF

echo ""
echo "✨ Готово!"

