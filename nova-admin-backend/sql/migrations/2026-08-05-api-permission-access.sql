ALTER TABLE sys_api_permission
    ADD COLUMN IF NOT EXISTS public_access SMALLINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sys_user_api_permission (
    user_id             BIGINT NOT NULL,
    api_permission_id   BIGINT NOT NULL,
    PRIMARY KEY (user_id, api_permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_api_permission_key
    ON sys_user_api_permission(api_permission_id);
