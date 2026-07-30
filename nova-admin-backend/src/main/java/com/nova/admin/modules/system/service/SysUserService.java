package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.UserCreateRequest;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.dto.UserUpdateRequest;
import com.nova.admin.modules.system.dto.UserImportResultDTO;
import com.nova.admin.modules.system.entity.SysUser;
import org.springframework.web.multipart.MultipartFile;

/**
 * 用户 Service
 */
public interface SysUserService extends IService<SysUser> {

    /**
     * 用户分页列表
     */
    PageResult<SysUser> getUserPage(UserPageQuery query);

    /**
     * 创建用户
     */
    Long createUser(UserCreateRequest req);

    /**
     * 更新用户
     */
    void updateUser(UserUpdateRequest req);

    /**
     * 删除用户（逻辑删除 + 删除角色关联）
     */
    void deleteUser(Long id);

    /**
     * 重置密码
     */
    void resetPassword(Long id, String newPassword);

    /**
     * 更新状态
     */
    void updateStatus(Long id, Integer status);

    byte[] exportUsers(UserPageQuery query);

    byte[] userImportTemplate();

    UserImportResultDTO importUsers(MultipartFile file);
}
