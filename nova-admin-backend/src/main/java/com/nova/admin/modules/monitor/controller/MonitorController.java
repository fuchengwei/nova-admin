package com.nova.admin.modules.monitor.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.monitor.dto.CacheInfo;
import com.nova.admin.modules.monitor.dto.OnlineUser;
import com.nova.admin.modules.monitor.dto.OnlineUserPageQuery;
import com.nova.admin.modules.monitor.dto.ServerInfo;
import com.nova.admin.modules.monitor.service.MonitorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "服务监控")
@RestController
@RequestMapping("/monitor")
@RequiredArgsConstructor
public class MonitorController extends BaseController {

    private final MonitorService monitorService;

    @Operation(summary = "获取服务器信息")
    @GetMapping("/server")
    @PreAuthorize("hasAuthority('monitor:server:list')")
    public R<ServerInfo> serverInfo() {
        return ok(monitorService.getServerInfo());
    }

    @Operation(summary = "获取在线用户列表")
    @GetMapping("/online")
    @PreAuthorize("hasAuthority('monitor:online:list')")
    public R<List<OnlineUser>> onlineUsers() {
        return ok(monitorService.getOnlineUsers());
    }

    @Operation(summary = "分页查询在线用户")
    @GetMapping("/online/page")
    @PreAuthorize("hasAuthority('monitor:online:list')")
    public R<PageResult<OnlineUser>> onlineUserPage(OnlineUserPageQuery query) {
        return ok(monitorService.getOnlineUserPage(query));
    }

    @Operation(summary = "获取缓存信息")
    @GetMapping("/cache")
    @PreAuthorize("hasAuthority('monitor:cache:list')")
    public R<CacheInfo> cacheInfo() {
        return ok(monitorService.getCacheInfo());
    }
}
