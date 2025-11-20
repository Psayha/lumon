#!/bin/bash
# Скрипт для применения миграции metadata на сервере

SERVER_IP="91.229.10.47"
SERVER_USER="root"

echo "🚀 Загружаем миграцию на сервер..."

# Загружаем файл миграции на сервер
scp ../base/supabase/migrations/002_add_metadata_to_messages.sql ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "✅ Файл загружен"
echo "📝 Применяем миграцию..."

# Применяем миграцию через Docker
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
  echo "➡️ Добавляем колонку metadata в таблицу messages..."
  docker exec -i lumon-supabase-db psql -U postgres -d lumon < /tmp/002_add_metadata_to_messages.sql

  if [ $? -eq 0 ]; then
    echo "✅ Миграция применена успешно!"

    echo ""
    echo "📊 Проверяем структуру таблицы messages..."
    docker exec -i lumon-supabase-db psql -U postgres -d lumon << SQL
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'messages'
      AND column_name IN ('metadata', 'attachments')
    ORDER BY column_name;
SQL
  else
    echo "❌ Ошибка при применении миграции"
    exit 1
  fi

  # Удаляем временный файл
  rm /tmp/002_add_metadata_to_messages.sql
EOF

echo ""
echo "✨ Готово!"
echo ""
echo "📝 Что дальше:"
echo "1. Проверьте, что колонка metadata добавлена"
echo "2. Перезапустите API сервис: cd /home/user/lumon/back/api && pm2 restart lumon-api"
