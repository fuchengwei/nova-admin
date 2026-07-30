package com.nova.admin.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Connection;
import java.sql.ResultSet;

/** 为已有部署补齐密码生命周期字段和默认策略。 */
@Slf4j
@Configuration
public class PasswordLifecycleSchemaInitializer {

    @Bean
    ApplicationRunner passwordLifecycleSchemaRunner(JdbcTemplate jdbcTemplate) {
        return args -> {
            if (!tableExists(jdbcTemplate, "sys_user")) {
                return;
            }

            jdbcTemplate.execute("ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS force_password_change SMALLINT NOT NULL DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP");
            jdbcTemplate.update("""
                    UPDATE sys_user
                    SET password_changed_at = COALESCE(password_changed_at, create_time, CURRENT_TIMESTAMP)
                    WHERE password_changed_at IS NULL
                    """);

            if (tableExists(jdbcTemplate, "sys_config")) {
                jdbcTemplate.update("""
                        INSERT INTO sys_config
                            (id, config_key, config_value, config_group, value_type, description, builtin, create_time, update_time, deleted)
                        SELECT 1111, 'security.password.expire-days', '0', 'security', 'number', '密码有效期（天）', 1,
                               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
                        WHERE NOT EXISTS (
                            SELECT 1 FROM sys_config
                            WHERE config_key = 'security.password.expire-days' AND deleted = 0
                        )
                        """);
            }
            log.info("密码生命周期字段与默认策略已就绪");
        };
    }

    private boolean tableExists(JdbcTemplate jdbcTemplate, String tableName) {
        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            return hasTable(connection, tableName) || hasTable(connection, tableName.toUpperCase());
        } catch (Exception ex) {
            log.warn("检查数据库表失败，跳过密码生命周期初始化", ex);
            return false;
        }
    }

    private boolean hasTable(Connection connection, String tableName) throws Exception {
        try (ResultSet resultSet = connection.getMetaData().getTables(null, null, tableName, new String[] {"TABLE"})) {
            return resultSet.next();
        }
    }
}
