-- Migration: Create backups and health_checks tables
-- Date: 2025-11-06

-- Table for storing backup metadata
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    status VARCHAR(50) DEFAULT 'completed', -- completed, failed, in_progress
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);

-- Table for storing health check results
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL, -- n8n, postgresql, nginx, supabase-studio
    status VARCHAR(50) NOT NULL, -- healthy, unhealthy, degraded
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_by UUID REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);

-- Table for storing system status summary
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overall_status VARCHAR(50) NOT NULL, -- healthy, degraded, down
    services_status JSONB NOT NULL, -- { "n8n": "healthy", "postgresql": "healthy", ... }
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_system_status_last_checked ON system_status(last_checked_at DESC);

