package com.nova.admin.modules.dashboard.service;

import com.nova.admin.modules.dashboard.dto.DashboardOverviewDTO;
import com.nova.admin.modules.dashboard.dto.DashboardRange;
import com.nova.admin.modules.dashboard.mapper.DashboardMapper;
import com.nova.admin.modules.dashboard.service.impl.DashboardServiceImpl;
import com.nova.admin.modules.monitor.dto.OnlineUser;
import com.nova.admin.modules.monitor.dto.ServerInfo;
import com.nova.admin.modules.monitor.service.MonitorService;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardServiceImplTest {

    @Test
    void getOverview_whenDataAvailable_returnsContinuousTrendAndRuntime() {
        DashboardOverviewDTO.Stats stats = new DashboardOverviewDTO.Stats();
        stats.setUserCount(12);
        stats.setRoleCount(3);
        stats.setDeptCount(4);
        stats.setFileCount(8);
        stats.setJobCount(2);
        LocalDate today = LocalDate.now();

        DashboardServiceImpl dashboardService = new DashboardServiceImpl(
                dashboardMapper(stats, List.of(loginPoint(today, 4)), List.of(operationPoint(today, 7)), List.of(activity())),
                new TestMonitorService(serverInfo(), List.of(new OnlineUser(), new OnlineUser()), null));

        DashboardOverviewDTO result = dashboardService.getOverview(DashboardRange.DAYS_7);

        assertThat(result.getStats().isAvailable()).isTrue();
        assertThat(result.getTrend().getData()).hasSize(7);
        assertThat(result.getTrend().getData().getLast())
                .extracting(DashboardOverviewDTO.TrendPoint::getLoginCount,
                        DashboardOverviewDTO.TrendPoint::getOperationCount)
                .containsExactly(4L, 7L);
        assertThat(result.getRuntime().getData())
                .extracting(DashboardOverviewDTO.Runtime::isOnline,
                        DashboardOverviewDTO.Runtime::getOnlineUserCount,
                        DashboardOverviewDTO.Runtime::getCpuUsage,
                        DashboardOverviewDTO.Runtime::getMemoryUsage,
                        DashboardOverviewDTO.Runtime::getJvmUsage)
                .containsExactly(true, 2L, 100D, 50D, 25D);
        assertThat(result.getActivities().getData()).hasSize(1);
    }

    @Test
    void getOverview_whenMonitorFails_marksOnlyRuntimeUnavailable() {
        DashboardServiceImpl dashboardService = new DashboardServiceImpl(
                dashboardMapper(new DashboardOverviewDTO.Stats(), List.of(), List.of(), List.of()),
                new TestMonitorService(null, List.of(), new IllegalStateException("Redis unavailable")));

        DashboardOverviewDTO result = dashboardService.getOverview(DashboardRange.DAYS_30);

        assertThat(result.getStats().isAvailable()).isTrue();
        assertThat(result.getTrend().isAvailable()).isTrue();
        assertThat(result.getActivities().isAvailable()).isTrue();
        assertThat(result.getRuntime().isAvailable()).isFalse();
        assertThat(result.getRuntime().getData().isOnline()).isFalse();
        assertThat(result.getTrend().getData()).hasSize(30);
    }

    private DashboardOverviewDTO.TrendPoint loginPoint(LocalDate date, long count) {
        DashboardOverviewDTO.TrendPoint point = new DashboardOverviewDTO.TrendPoint();
        point.setDate(date.toString());
        point.setLoginCount(count);
        return point;
    }

    private DashboardOverviewDTO.TrendPoint operationPoint(LocalDate date, long count) {
        DashboardOverviewDTO.TrendPoint point = new DashboardOverviewDTO.TrendPoint();
        point.setDate(date.toString());
        point.setOperationCount(count);
        return point;
    }

    private DashboardOverviewDTO.Activity activity() {
        DashboardOverviewDTO.Activity activity = new DashboardOverviewDTO.Activity();
        activity.setType("LOGIN");
        activity.setAccount("admin");
        activity.setOccurredAt(LocalDateTime.now());
        return activity;
    }

    private ServerInfo serverInfo() {
        ServerInfo info = new ServerInfo();
        ServerInfo.Cpu cpu = new ServerInfo.Cpu();
        cpu.setUsed(120D);
        info.setCpu(cpu);
        ServerInfo.Mem memory = new ServerInfo.Mem();
        memory.setUsage(50D);
        info.setMem(memory);
        ServerInfo.Jvm jvm = new ServerInfo.Jvm();
        jvm.setUsage(25D);
        info.setJvm(jvm);
        return info;
    }

    private DashboardMapper dashboardMapper(
            DashboardOverviewDTO.Stats stats,
            List<DashboardOverviewDTO.TrendPoint> loginTrend,
            List<DashboardOverviewDTO.TrendPoint> operationTrend,
            List<DashboardOverviewDTO.Activity> activities) {
        return new DashboardMapper() {
            @Override
            public DashboardOverviewDTO.Stats selectStats() {
                return stats;
            }

            @Override
            public List<DashboardOverviewDTO.TrendPoint> selectLoginTrend(
                    LocalDateTime start, LocalDateTime end) {
                return loginTrend;
            }

            @Override
            public List<DashboardOverviewDTO.TrendPoint> selectOperationTrend(
                    LocalDateTime start, LocalDateTime end) {
                return operationTrend;
            }

            @Override
            public List<DashboardOverviewDTO.Activity> selectRecentActivities(int limit) {
                return activities;
            }
        };
    }

    private static class TestMonitorService extends MonitorService {
        private final ServerInfo serverInfo;
        private final List<OnlineUser> onlineUsers;
        private final RuntimeException exception;

        TestMonitorService(ServerInfo serverInfo, List<OnlineUser> onlineUsers, RuntimeException exception) {
            super(null);
            this.serverInfo = serverInfo;
            this.onlineUsers = onlineUsers;
            this.exception = exception;
        }

        @Override
        public ServerInfo getServerInfo() {
            if (exception != null) {
                throw exception;
            }
            return serverInfo;
        }

        @Override
        public List<OnlineUser> getOnlineUsers() {
            return onlineUsers;
        }
    }
}
