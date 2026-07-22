package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.security.SecurityUtils;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.UserInfoDTO;
import com.nova.admin.modules.system.service.AuthQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "系统 - 当前用户")
@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
public class UserInfoController extends BaseController {

    private final AuthQueryService authQueryService;

    @Operation(summary = "获取当前登录用户信息")
    @GetMapping("/user/me")
    public R<UserInfoDTO> me() {
        Long userId = SecurityUtils.requireUserId();
        return ok(authQueryService.currentUserInfo(userId));
    }

    @Operation(summary = "获取当前用户菜单树（路由用）")
    @GetMapping("/menu/routers")
    public R<List<MenuTreeDTO>> routers() {
        Long userId = SecurityUtils.requireUserId();
        return ok(authQueryService.currentUserMenuTree(userId));
    }
}
