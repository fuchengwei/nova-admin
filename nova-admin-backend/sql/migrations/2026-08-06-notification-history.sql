ALTER TABLE sys_message
    ADD COLUMN IF NOT EXISTS publisher_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_message_publisher_created
    ON sys_message(publisher_id, create_time DESC)
    WHERE deleted = 0;
