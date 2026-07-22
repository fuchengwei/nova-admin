package com.nova.admin.modules.monitor.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/** 服务器监控信息 */
@Data
public class ServerInfo implements Serializable {
    private static final long serialVersionUID = 1L;

    /** CPU 信息 */
    private Cpu cpu;
    /** 内存信息 */
    private Mem mem;
    /** JVM 信息 */
    private Jvm jvm;
    /** 系统运行信息 */
    private Sys sys;
    /** 磁盘信息 */
    private List<Disk> disks;

    @Data
    public static class Cpu implements Serializable {
        private static final long serialVersionUID = 1L;
        /** 核心数 */
        private int cpuNum;
        /** 系统使用率（%） */
        private double sys;
        /** 用户使用率（%） */
        private double used;
        /** 当前负载 */
        private double free;
    }

    @Data
    public static class Mem implements Serializable {
        private static final long serialVersionUID = 1L;
        /** 总内存（GB） */
        private double total;
        /** 已用（GB） */
        private double used;
        /** 剩余（GB） */
        private double free;
        /** 使用率（%） */
        private double usage;
    }

    @Data
    public static class Jvm implements Serializable {
        private static final long serialVersionUID = 1L;
        private String name;
        private String version;
        private String home;
        private double total;       // 总内存 GB
        private double used;        // 已用 GB
        private double free;        // 剩余 GB
        private double usage;       // 使用率 %
        private String startTime;   // 启动时间
        private String runTime;     // 运行时长
        private String inputArgs;   // JVM 参数
    }

    @Data
    public static class Sys implements Serializable {
        private static final long serialVersionUID = 1L;
        private String computerName;
        private String computerIp;
        private String osName;
        private String osArch;
        private String userDir;
    }

    @Data
    public static class Disk implements Serializable {
        private static final long serialVersionUID = 1L;
        private String dirName;
        private String sysTypeName;
        private String typeName;
        private double total;   // GB
        private double used;    // GB
        private double free;    // GB
        private double usage;   // %
    }
}
