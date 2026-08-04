package com.nova.admin.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Connection;
import java.sql.ResultSet;
import java.util.Objects;

/**
 * 为已有部署补齐定时任务执行历史字段和索引。
 */
@Slf4j
@Configuration
public class JobLogSchemaInitializer {

    @Bean
    ApplicationRunner jobLogSchemaRunner(JdbcTemplate jdbcTemplate) {
        return _ -> {
            if (!tableExists(jdbcTemplate)) {
                return;
            }

            jdbcTemplate.execute("ALTER TABLE sys_job_log ADD COLUMN IF NOT EXISTS job_group VARCHAR(64)");
            jdbcTemplate.execute("ALTER TABLE sys_job_log ADD COLUMN IF NOT EXISTS invoke_target VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE sys_job_log ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(16) NOT NULL DEFAULT 'CRON'");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_joblog_job_time ON sys_job_log(job_id, start_time DESC)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_joblog_status ON sys_job_log(status)");
            log.info("定时任务执行历史字段与索引已就绪");
        };
    }

    private boolean tableExists(JdbcTemplate jdbcTemplate) {
        try (Connection connection = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            return hasTable(connection, "sys_job_log") || hasTable(connection, "sys_job_log".toUpperCase());
        } catch (Exception ex) {
            log.warn("检查定时任务执行历史表失败，跳过结构初始化", ex);
            return false;
        }
    }

    private boolean hasTable(Connection connection, String tableName) throws Exception {
        try (ResultSet resultSet = connection.getMetaData().getTables(null, null, tableName, new String[]{"TABLE"})) {
            return resultSet.next();
        }
    }
}
