package com.nova.admin.modules.monitor.service;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.auth.service.AuthSessionService;
import com.nova.admin.modules.monitor.dto.CacheInfo;
import com.nova.admin.modules.monitor.dto.OnlineUser;
import com.nova.admin.modules.monitor.dto.OnlineUserPageQuery;
import com.nova.admin.modules.monitor.dto.ServerInfo;
import com.nova.admin.security.LoginSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.Set;

/**
 * 系统监控服务：收集服务器、在线用户、缓存（Redis）信息。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final AuthSessionService authSessionService;

    private static final double GB = 1024.0 * 1024.0 * 1024.0;
    private static final long KB = 1024L;
    private static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    /** 收集服务器（CPU/内存/JVM/系统/磁盘）信息 */
    public ServerInfo getServerInfo() {
        ServerInfo info = new ServerInfo();
        info.setCpu(collectCpu());
        info.setMem(collectMem());
        info.setJvm(collectJvm());
        info.setSys(collectSys());
        info.setDisks(collectDisks());
        return info;
    }

    private ServerInfo.Cpu collectCpu() {
        ServerInfo.Cpu cpu = new ServerInfo.Cpu();
        com.sun.management.OperatingSystemMXBean osBean =
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        cpu.setCpuNum(osBean.getAvailableProcessors());
        double load = osBean.getCpuLoad() * 100.0;
        if (load < 0) {
            load = osBean.getSystemLoadAverage() * 100.0;
        }
        if (load < 0) {
            load = 0;
        }
        cpu.setSys(round2(load));
        cpu.setUsed(round2(load));
        cpu.setFree(round2(100.0 - load));
        return cpu;
    }

    private ServerInfo.Mem collectMem() {
        ServerInfo.Mem mem = new ServerInfo.Mem();
        com.sun.management.OperatingSystemMXBean osBean =
                (com.sun.management.OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        long total = osBean.getTotalMemorySize();
        long free = osBean.getFreeMemorySize();
        long used = total - free;
        mem.setTotal(round2(total / GB));
        mem.setUsed(round2(used / GB));
        mem.setFree(round2(free / GB));
        mem.setUsage(total == 0 ? 0 : round2(used * 100.0 / total));
        return mem;
    }

    private ServerInfo.Jvm collectJvm() {
        ServerInfo.Jvm jvm = new ServerInfo.Jvm();
        RuntimeMXBean runtimeMx = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memoryMx = ManagementFactory.getMemoryMXBean();
        long total = Runtime.getRuntime().totalMemory();
        long free = Runtime.getRuntime().freeMemory();
        long used = total - free;
        jvm.setName(runtimeMx.getVmName());
        jvm.setVersion(runtimeMx.getSpecVersion());
        jvm.setHome(System.getProperty("java.home"));
        jvm.setTotal(round2(total / GB));
        jvm.setFree(round2(free / GB));
        jvm.setUsed(round2(used / GB));
        jvm.setUsage(total == 0 ? 0 : round2(used * 100.0 / total));
        long startTime = runtimeMx.getStartTime();
        long upTime = runtimeMx.getUptime();
        jvm.setStartTime(SDF.format(new Date(startTime)));
        jvm.setRunTime(formatDuration(upTime));
        jvm.setInputArgs(String.join(" ", runtimeMx.getInputArguments()));
        return jvm;
    }

    private ServerInfo.Sys collectSys() {
        ServerInfo.Sys sys = new ServerInfo.Sys();
        try {
            InetAddress addr = InetAddress.getLocalHost();
            sys.setComputerName(addr.getHostName());
            sys.setComputerIp(addr.getHostAddress());
        } catch (UnknownHostException e) {
            sys.setComputerName("unknown");
            sys.setComputerIp("unknown");
        }
        sys.setOsName(System.getProperty("os.name"));
        sys.setOsArch(System.getProperty("os.arch"));
        sys.setUserDir(System.getProperty("user.dir"));
        return sys;
    }

    private List<ServerInfo.Disk> collectDisks() {
        List<ServerInfo.Disk> disks = new ArrayList<>();
        for (File root : File.listRoots()) {
            ServerInfo.Disk disk = new ServerInfo.Disk();
            long total = root.getTotalSpace();
            long free = root.getFreeSpace();
            long usable = root.getUsableSpace();
            long used = total - free;
            disk.setDirName(root.getPath());
            disk.setSysTypeName(root.exists() ? "file" : "-");
            disk.setTypeName(root.getPath());
            disk.setTotal(round2(total / GB));
            disk.setUsed(round2(used / GB));
            disk.setFree(round2(usable / GB));
            disk.setUsage(total == 0 ? 0 : round2(used * 100.0 / total));
            disks.add(disk);
        }
        return disks;
    }

    /** 在线用户：读取仍持有有效 access token 的服务端会话。 */
    public List<OnlineUser> getOnlineUsers() {
        List<OnlineUser> list = new ArrayList<>();
        for (LoginSession session : authSessionService.getActiveSessions()) {
            OnlineUser o = new OnlineUser();
            o.setTokenKey(session.getAccessJti());
            o.setAccount(session.getAccount());
            o.setNickname(session.getNickname());
            o.setDeptId(session.getDeptId());
            o.setLoginIp(session.getLoginIp());
            o.setLoginTime(session.getLoginTime() == null ? null : SDF.format(new Date(session.getLoginTime())));
            list.add(o);
        }
        return list;
    }

    public void kickSession(String accessJti) {
        authSessionService.revokeSession(accessJti);
    }

    public PageResult<OnlineUser> getOnlineUserPage(OnlineUserPageQuery query) {
        return pageOnlineUsers(getOnlineUsers(), query);
    }

    PageResult<OnlineUser> pageOnlineUsers(List<OnlineUser> users, OnlineUserPageQuery query) {
        List<OnlineUser> filtered = users.stream()
                .filter(user -> contains(user.getAccount(), query.getAccount()))
                .filter(user -> contains(user.getNickname(), query.getNickname()))
                .filter(user -> contains(user.getLoginIp(), query.getLoginIp()))
                .sorted(Comparator.comparing(OnlineUser::getLoginTime,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        long total = filtered.size();
        long current = Math.max(query.getCurrent(), 1L);
        long size = Math.max(query.getSize(), 1L);
        long start = Math.min((current - 1) * size, total);
        long end = Math.min(start + size, total);
        return PageResult.of(total, current, size, filtered.subList((int) start, (int) end));
    }

    private boolean contains(String value, String keyword) {
        return !StringUtils.hasText(keyword) || (value != null && value.contains(keyword.trim()));
    }

    /** 缓存（Redis）信息 */
    @SuppressWarnings("SpellCheckingInspection")
    public CacheInfo getCacheInfo() {
        CacheInfo info = new CacheInfo();
        Properties props = redisTemplate.execute((RedisCallback<Properties>) connection ->
                connection.serverCommands().info());
        Properties commandStatsProps = redisTemplate.execute((RedisCallback<Properties>) connection ->
                connection.serverCommands().info("commandstats"));
        if (props != null) {
            CacheInfo.Server server = new CacheInfo.Server();
            server.setVersion(props.getProperty("redis_version"));
            server.setMode(props.getProperty("redis_mode"));
            server.setOs(props.getProperty("os"));
            server.setUptime(props.getProperty("uptime_in_days"));
            server.setUsedMemoryHuman(props.getProperty("used_memory_human"));
            server.setMaxMemoryHuman(props.getProperty("maxmemory_human"));
            server.setConnectedClients(props.getProperty("connected_clients"));
            server.setMaxMemoryPolicy(props.getProperty("maxmemory_policy"));
            info.setServer(server);
        }
        info.setCommandStats(parseCommandStats(commandStatsProps));
        Long dbSize = redisTemplate.execute((RedisCallback<Long>) connection -> connection.serverCommands().dbSize());
        info.setDbSize(dbSize == null ? 0L : dbSize);
        return info;
    }

    List<CacheInfo.CommandStat> parseCommandStats(Properties props) {
        if (props == null) {
            return List.of();
        }
        List<CacheInfo.CommandStat> stats = new ArrayList<>();
        props.stringPropertyNames().stream()
                .filter(name -> name.startsWith("cmdstat_"))
                .sorted()
                .forEach(name -> {
                    CacheInfo.CommandStat stat = new CacheInfo.CommandStat();
                    stat.setName(name.substring("cmdstat_".length()));
                    stat.setValue(props.getProperty(name));
                    stats.add(stat);
                });
        return stats;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static String formatDuration(long millis) {
        long seconds = millis / 1000;
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        return days + " 天 " + hours + " 小时 " + minutes + " 分钟 " + secs + " 秒";
    }
}
