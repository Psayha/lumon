-- Migration: Add system metrics to health_checks and system_status
-- Date: 2025-11-06

-- Add metrics columns to health_checks
ALTER TABLE health_checks 
ADD COLUMN IF NOT EXISTS metrics JSONB;

-- Add system metrics to system_status
ALTER TABLE system_status
ADD COLUMN IF NOT EXISTS system_metrics JSONB;

-- Add index for system service checks
CREATE INDEX IF NOT EXISTS idx_health_checks_system ON health_checks(service_name) WHERE service_name = 'system';

