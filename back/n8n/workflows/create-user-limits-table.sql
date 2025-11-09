-- Создание таблицы user_limits для управления лимитами пользователей
-- Эта таблица может не существовать, если миграция не была применена

CREATE TABLE IF NOT EXISTS user_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    limit_type VARCHAR(50) NOT NULL, -- 'generations_per_day', 'chats_per_month', 'messages_per_day', etc.
    limit_value INTEGER NOT NULL DEFAULT 0,
    current_usage INTEGER DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, limit_type)
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_limits_type ON user_limits(limit_type);
CREATE INDEX IF NOT EXISTS idx_user_limits_reset_at ON user_limits(reset_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в user_limits
DROP TRIGGER IF EXISTS update_user_limits_updated_at ON user_limits;
CREATE TRIGGER update_user_limits_updated_at
    BEFORE UPDATE ON user_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

