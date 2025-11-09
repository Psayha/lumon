-- Migration: Create tables for legal documents and AI documents
-- Date: 2025-11-06

-- Table for legal documents (for AgreementModal)
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'agreement', -- agreement, privacy_policy, terms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active);

-- Table for AI documents (for KnowledgeBasePage)
CREATE TABLE IF NOT EXISTS ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'processing', -- processed, processing, error
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    metadata JSONB,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_documents_status ON ai_documents(status);
CREATE INDEX IF NOT EXISTS idx_ai_documents_company ON ai_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_uploaded_at ON ai_documents(uploaded_at DESC);

-- Insert default legal documents
INSERT INTO legal_documents (title, content, document_type, is_active) VALUES
('Пользовательское соглашение', 'Текст пользовательского соглашения...', 'agreement', true),
('Политика конфиденциальности', 'Текст политики конфиденциальности...', 'privacy_policy', true)
ON CONFLICT DO NOTHING;

