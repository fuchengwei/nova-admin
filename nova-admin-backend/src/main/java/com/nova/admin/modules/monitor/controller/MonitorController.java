package com.nova.admin.modules.monitor.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.monitor.dto.CacheInfo;
import com.nova.admin.modules.monitor.dto.OnlineUser;
import com.nova.admin.modules.monitor.dto.ServerInfo;
import com.nova.admin.modules.monitor.service.MonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/monitor")
@RequiredArgsConstructor
public class MonitorController extends BaseController {

    private final MonitorService monitorService;

    @GetMapping("/server")
    @PreAuthorize("hasAuthority('monitor:server:list')")
    public R<ServerInfo> serverInfo() {
        return ok(monitorService.getServerInfo());
    }

    @GetMapping("/online")
    @PreAuthorize("hasAuthority('monitor:online:list')")
    public R<List<OnlineUser>> onlineUsers() {
        return ok(monitorService.getOnlineUsers());
    }

    @GetMapping("/cache")
    @PreAuthorize("hasAuthority('monitor:cache:list')")
    public R<CacheInfo> cacheInfo() {
        return ok(monitorService.getCacheInfo());
    }
}
