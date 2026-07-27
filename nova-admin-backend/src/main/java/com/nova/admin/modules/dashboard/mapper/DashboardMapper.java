package com.nova.admin.modules.dashboard.mapper;

import com.nova.admin.modules.dashboard.dto.DashboardOverviewDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface DashboardMapper {

    @Select("""
            SELECT
                (SELECT COUNT(*) FROM sys_user WHERE deleted = 0) AS user_count,
                (SELECT COUNT(*) FROM sys_role WHERE deleted = 0) AS role_count,
                (SELECT COUNT(*) FROM sys_dept WHERE deleted = 0) AS dept_count,
                (SELECT COUNT(*) FROM sys_file WHERE deleted = 0) AS file_count,
                (SELECT COUNT(*) FROM sys_job WHERE deleted = 0) AS job_count
            """)
    DashboardOverviewDTO.Stats selectStats();

    @Select("""
            SELECT TO_CHAR(login_time, 'YYYY-MM-DD') AS date, COUNT(*) AS login_count
            FROM sys_login_log
            WHERE login_time >= #{start} AND login_time < #{end}
            GROUP BY TO_CHAR(login_time, 'YYYY-MM-DD')
            ORDER BY date
            """)
    List<DashboardOverviewDTO.TrendPoint> selectLoginTrend(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Select("""
            SELECT TO_CHAR(create_time, 'YYYY-MM-DD') AS date, COUNT(*) AS operation_count
            FROM sys_operation_log
            WHERE create_time >= #{start} AND create_time < #{end}
            GROUP BY TO_CHAR(create_time, 'YYYY-MM-DD')
            ORDER BY date
            """)
    List<DashboardOverviewDTO.TrendPoint> selectOperationTrend(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Select("""
            SELECT type, account, summary, occurred_at, status
            FROM (
                SELECT
                    'LOGIN' AS type,
                    account,
                    COALESCE(NULLIF(msg, ''), 'login') AS summary,
                    login_time AS occurred_at,
                    status
                FROM sys_login_log
                UNION ALL
                SELECT
                    'OPERATION' AS type,
                    account,
                    COALESCE(NULLIF(description, ''), CONCAT_WS(' ', module, action)) AS summary,
                    create_time AS occurred_at,
                    status
                FROM sys_operation_log
            ) activity
            ORDER BY occurred_at DESC NULLS LAST
            LIMIT #{limit}
            """)
    List<DashboardOverviewDTO.Activity> selectRecentActivities(@Param("limit") int limit);
}
