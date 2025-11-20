-- Add metadata column to messages table
-- This fixes the mismatch between TypeORM entity and database schema

-- Add metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index for better performance on metadata queries
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin(metadata);

-- Optional: If you want to migrate data from attachments to metadata
-- UPDATE messages SET metadata = attachments WHERE attachments IS NOT NULL AND attachments != '[]'::jsonb;
