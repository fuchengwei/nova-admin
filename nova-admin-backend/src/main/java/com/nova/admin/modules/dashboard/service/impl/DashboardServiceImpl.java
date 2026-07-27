package com.nova.admin.modules.dashboard.service.impl;

import com.nova.admin.modules.dashboard.dto.DashboardOverviewDTO;
import com.nova.admin.modules.dashboard.dto.DashboardRange;
import com.nova.admin.modules.dashboard.mapper.DashboardMapper;
import com.nova.admin.modules.dashboard.service.DashboardService;
import com.nova.admin.modules.monitor.dto.ServerInfo;
import com.nova.admin.modules.monitor.service.MonitorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final String APP_NAME = "nova-admin";
    private static final String VERSION = "1.0.0-SNAPSHOT";
    private static final int ACTIVITY_LIMIT = 5;

    private final DashboardMapper dashboardMapper;
    private final MonitorService monitorService;

    @Override
    @Transactional(readOnly = true)
    public DashboardOverviewDTO getOverview(DashboardRange range) {
        DashboardOverviewDTO overview = new DashboardOverviewDTO();
        overview.setStats(loadStats());
        overview.setTrend(loadTrend(range));
        overview.setRuntime(loadRuntime());
        overview.setActivities(loadActivities());
        overview.setUpdatedAt(LocalDateTime.now(Clock.systemDefaultZone()));
        return overview;
    }

    private DashboardOverviewDTO.Section<DashboardOverviewDTO.Stats> loadStats() {
        try {
            return available(dashboardMapper.selectStats());
        } catch (RuntimeException ex) {
            log.warn("Failed to load dashboard statistics", ex);
            return unavailable(new DashboardOverviewDTO.Stats());
        }
    }

    private DashboardOverviewDTO.Section<List<DashboardOverviewDTO.TrendPoint>> loadTrend(DashboardRange range) {
        try {
            LocalDate today = LocalDate.now(Clock.systemDefaultZone());
            LocalDate startDate = today.minusDays(range.getDays() - 1L);
            LocalDateTime start = startDate.atStartOfDay();
            LocalDateTime end = today.plusDays(1).atStartOfDay();
            Map<String, Long> loginCounts = toCountMap(dashboardMapper.selectLoginTrend(start, end), true);
            Map<String, Long> operationCounts = toCountMap(dashboardMapper.selectOperationTrend(start, end), false);
            List<DashboardOverviewDTO.TrendPoint> points = new ArrayList<>();
            for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
                DashboardOverviewDTO.TrendPoint point = new DashboardOverviewDTO.TrendPoint();
                point.setDate(date.toString());
                point.setLoginCount(loginCounts.getOrDefault(point.getDate(), 0L));
                point.setOperationCount(operationCounts.getOrDefault(point.getDate(), 0L));
                points.add(point);
            }
            return available(points);
        } catch (RuntimeException ex) {
            log.warn("Failed to load dashboard trend", ex);
            return unavailable(List.of());
        }
    }

    private DashboardOverviewDTO.Section<DashboardOverviewDTO.Runtime> loadRuntime() {
        DashboardOverviewDTO.Runtime runtime = new DashboardOverviewDTO.Runtime();
        runtime.setAppName(APP_NAME);
        runtime.setVersion(VERSION);
        try {
            ServerInfo server = monitorService.getServerInfo();
            runtime.setOnline(true);
            runtime.setOnlineUserCount(monitorService.getOnlineUsers().size());
            runtime.setCpuUsage(clamp(server.getCpu().getUsed()));
            runtime.setMemoryUsage(clamp(server.getMem().getUsage()));
            runtime.setJvmUsage(clamp(server.getJvm().getUsage()));
            return available(runtime);
        } catch (RuntimeException ex) {
            log.warn("Failed to load dashboard runtime", ex);
            runtime.setOnline(false);
            return unavailable(runtime);
        }
    }

    private DashboardOverviewDTO.Section<List<DashboardOverviewDTO.Activity>> loadActivities() {
        try {
            return available(dashboardMapper.selectRecentActivities(ACTIVITY_LIMIT));
        } catch (RuntimeException ex) {
            log.warn("Failed to load dashboard activities", ex);
            return unavailable(List.of());
        }
    }

    private Map<String, Long> toCountMap(List<DashboardOverviewDTO.TrendPoint> rows, boolean login) {
        Map<String, Long> counts = new HashMap<>();
        for (DashboardOverviewDTO.TrendPoint row : rows) {
            counts.put(row.getDate(), login ? row.getLoginCount() : row.getOperationCount());
        }
        return counts;
    }

    private Double clamp(double value) {
        return Math.max(0D, Math.min(100D, value));
    }

    private <T> DashboardOverviewDTO.Section<T> available(T data) {
        DashboardOverviewDTO.Section<T> section = new DashboardOverviewDTO.Section<>();
        section.setAvailable(true);
        section.setData(data);
        return section;
    }

    private <T> DashboardOverviewDTO.Section<T> unavailable(T data) {
        DashboardOverviewDTO.Section<T> section = new DashboardOverviewDTO.Section<>();
        section.setAvailable(false);
        section.setData(data);
        return section;
    }
}
