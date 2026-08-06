ALTER TABLE sys_message
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(10),
    ADD COLUMN IF NOT EXISTS recipient_ids TEXT,
    ADD COLUMN IF NOT EXISTS error_msg TEXT;

CREATE INDEX IF NOT EXISTS idx_message_status_scheduled
    ON sys_message(status, scheduled_at) WHERE deleted = 0;
