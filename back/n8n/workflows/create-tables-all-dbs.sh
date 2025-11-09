#!/bin/bash

# Скрипт для создания таблиц AB experiments во всех PostgreSQL контейнерах

echo "Поиск PostgreSQL контейнеров..."
CONTAINERS=$(docker ps --format "{{.Names}}" | grep -i postgres)

if [ -z "$CONTAINERS" ]; then
    echo "PostgreSQL контейнеры не найдены"
    exit 1
fi

echo "Найдены контейнеры:"
echo "$CONTAINERS"
echo ""

# Создаем временный SQL файл
SQL_FILE="/tmp/create-ab-tables-safe.sql"
cat > "$SQL_FILE" << 'SQL_EOF'
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ab_experiments') THEN
        CREATE TABLE ab_experiments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            feature_name VARCHAR(255) NOT NULL,
            enabled BOOLEAN DEFAULT false,
            traffic_percentage INTEGER DEFAULT 0 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
            variant_a_config JSONB DEFAULT '{}',
            variant_b_config JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Таблица ab_experiments создана';
    ELSE
        RAISE NOTICE 'Таблица ab_experiments уже существует';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ab_assignments') THEN
        CREATE TABLE ab_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
            user_id VARCHAR(255) NOT NULL,
            variant VARCHAR(1) NOT NULL CHECK (variant IN ('A', 'B')),
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(experiment_id, user_id)
        );
        RAISE NOTICE 'Таблица ab_assignments создана';
    ELSE
        RAISE NOTICE 'Таблица ab_assignments уже существует';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_id ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user_id ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_variant ON ab_assignments(variant);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_feature_name ON ab_experiments(feature_name);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_enabled ON ab_experiments(enabled);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ab_experiments') THEN
        DROP TRIGGER IF EXISTS update_ab_experiments_updated_at ON ab_experiments;
        CREATE TRIGGER update_ab_experiments_updated_at
            BEFORE UPDATE ON ab_experiments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Триггер создан';
    END IF;
END $$;
SQL_EOF

for container in $CONTAINERS; do
    echo "=========================================="
    echo "Обработка контейнера: $container"
    echo "=========================================="
    
    # Пробуем разные базы данных
    for db in postgres public; do
        echo "Попытка подключения к базе: $db"
        if docker exec "$container" psql -U postgres -d "$db" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "✓ Подключение к $db успешно"
            echo "Создание таблиц в базе $db..."
            docker exec -i "$container" psql -U postgres -d "$db" < "$SQL_FILE"
            echo ""
        else
            echo "✗ Не удалось подключиться к $db"
        fi
    done
done

rm -f "$SQL_FILE"
echo "Готово!"
