package com.nova.admin.modules.monitor.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/** 缓存（Redis）监控信息 */
@Data
public class CacheInfo implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    /** 命令统计（commandStats） */
    private List<CommandStat> commandStats;
    /** 基本信息（server） */
    private Server server;
    /** 库大小信息（dbSize） */
    private Long dbSize;

    @Data
    public static class CommandStat implements Serializable {
        @Serial
        private static final long serialVersionUID = 1L;
        private String name;
        private String value;
    }

    @Data
    public static class Server implements Serializable {
        @Serial
        private static final long serialVersionUID = 1L;
        private String version;
        private String mode;
        private String os;
        private String uptime;
        private String usedMemoryHuman;
        private String maxMemoryHuman;
        private String connectedClients;
        private String maxMemoryPolicy;
    }
}
