package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.security.SecurityUtils;
import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.service.FileService;
import com.nova.admin.modules.system.dto.AvatarUpdateResponse;
import com.nova.admin.modules.system.dto.CurrentUserPasswordUpdateRequest;
import com.nova.admin.modules.system.dto.CurrentUserProfileUpdateRequest;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.UserInfoDTO;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.service.AuthQueryService;
import com.nova.admin.modules.system.service.SysConfigService;
import com.nova.admin.modules.system.service.SysUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "系统 - 当前用户")
@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
public class UserInfoController extends BaseController {

    private final AuthQueryService authQueryService;
    private final SysUserService sysUserService;
    private final SysConfigService sysConfigService;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "获取当前登录用户信息")
    @GetMapping("/user/me")
    public R<UserInfoDTO> me() {
        Long userId = SecurityUtils.requireUserId();
        return ok(authQueryService.currentUserInfo(userId));
    }

    @Operation(summary = "更新当前用户资料")
    @PutMapping("/user/me/profile")
    public R<Void> updateProfile(@Valid @RequestBody CurrentUserProfileUpdateRequest req) {
        Long userId = SecurityUtils.requireUserId();
        SysUser user = new SysUser();
        user.setId(userId);
        user.setNickname(req.getNickname());
        user.setRealName(req.getRealName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setGender(req.getGender());
        user.setUpdateBy(userId);
        sysUserService.updateById(user);
        return ok();
    }

    @Operation(summary = "上传当前用户头像")
    @PostMapping(value = "/user/me/avatar", consumes = "multipart/form-data")
    public R<AvatarUpdateResponse> uploadAvatar(
            @Parameter(description = "头像文件", required = true)
            @RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtils.requireUserId();
        sysConfigService.validateUpload(file, true);
        SysFile uploaded = fileService.upload(file);

        SysUser user = new SysUser();
        user.setId(userId);
        user.setAvatar(uploaded.getUrl());
        user.setUpdateBy(userId);
        sysUserService.updateById(user);

        return ok(AvatarUpdateResponse.builder().avatar(uploaded.getUrl()).build());
    }

    @Operation(summary = "修改当前用户密码")
    @PutMapping("/user/me/password")
    public R<Void> updatePassword(@Valid @RequestBody CurrentUserPasswordUpdateRequest req) {
        Long userId = SecurityUtils.requireUserId();
        SysUser user = sysUserService.getById(userId);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new BizException(ResultCode.PASSWORD_NOT_MATCH);
        }
        sysConfigService.validatePassword(req.getNewPassword());
        SysUser update = new SysUser();
        update.setId(userId);
        update.setPassword(passwordEncoder.encode(req.getNewPassword()));
        update.setUpdateBy(userId);
        sysUserService.updateById(update);
        return ok();
    }

    @Operation(summary = "获取当前用户菜单树（路由用）")
    @GetMapping("/menu/routers")
    public R<List<MenuTreeDTO>> routers() {
        Long userId = SecurityUtils.requireUserId();
        return ok(authQueryService.currentUserMenuTree(userId));
    }
}
