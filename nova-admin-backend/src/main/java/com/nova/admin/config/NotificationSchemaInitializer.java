package com.nova.admin.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Connection;
import java.util.Objects;

/** 为已有部署补齐消息草稿与定时发布字段。 */
@Slf4j
@Configuration
public class NotificationSchemaInitializer {

    @Bean
    ApplicationRunner notificationSchemaRunner(JdbcTemplate jdbcTemplate) {
        return _ -> {
            if (!tableExists(jdbcTemplate)) {
                return;
            }
            jdbcTemplate.execute("ALTER TABLE sys_message ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'SENT'");
            jdbcTemplate.execute("ALTER TABLE sys_message ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE sys_message ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(10)");
            jdbcTemplate.execute("ALTER TABLE sys_message ADD COLUMN IF NOT EXISTS recipient_ids TEXT");
            jdbcTemplate.execute("ALTER TABLE sys_message ADD COLUMN IF NOT EXISTS error_msg TEXT");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_message_status_scheduled ON sys_message(status, scheduled_at) WHERE deleted = 0");
            log.info("消息草稿与定时发布字段已就绪");
        };
    }

    private boolean tableExists(JdbcTemplate jdbcTemplate) {
        try (Connection connection = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            return hasTable(connection, "sys_message") || hasTable(connection, "SYS_MESSAGE");
        } catch (Exception ex) {
            log.warn("检查消息表失败，跳过结构初始化", ex);
            return false;
        }
    }

    private boolean hasTable(Connection connection, String tableName) throws Exception {
        try (var tables = connection.getMetaData().getTables(null, null, tableName, new String[]{"TABLE"})) {
            return tables.next();
        }
    }
}
