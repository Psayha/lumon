-- Migration: Analytics, User Management, Limits, A/B Testing
-- Date: 2025-11-06

-- Table for user limits management
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

CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_limits_type ON user_limits(limit_type);
CREATE INDEX IF NOT EXISTS idx_user_limits_reset_at ON user_limits(reset_at);

-- Table for A/B testing experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    feature_name VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    variant_a_config JSONB DEFAULT '{}',
    variant_b_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_name ON ab_experiments(name);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_feature ON ab_experiments(feature_name);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_enabled ON ab_experiments(enabled) WHERE enabled = true;

-- Table for A/B test assignments (which user gets which variant)
CREATE TABLE IF NOT EXISTS ab_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant VARCHAR(10) NOT NULL CHECK (variant IN ('A', 'B')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experiment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_variant ON ab_assignments(variant);

-- Table for A/B test events (tracking conversions)
CREATE TABLE IF NOT EXISTS ab_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant VARCHAR(10) NOT NULL CHECK (variant IN ('A', 'B')),
    event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'conversion', etc.
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_events_experiment ON ab_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_user ON ab_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_type ON ab_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_events_created_at ON ab_events(created_at DESC);

-- Table for platform statistics (daily aggregations)
CREATE TABLE IF NOT EXISTS platform_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_companies INTEGER DEFAULT 0,
    total_chats INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    new_companies INTEGER DEFAULT 0,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(date DESC);

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_limits_updated_at BEFORE UPDATE ON user_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_experiments_updated_at BEFORE UPDATE ON ab_experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_stats_updated_at BEFORE UPDATE ON platform_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

