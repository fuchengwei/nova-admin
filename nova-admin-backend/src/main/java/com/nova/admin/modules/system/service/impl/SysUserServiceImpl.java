package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.dto.UserCreateRequest;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.dto.UserUpdateRequest;
import com.nova.admin.modules.system.entity.SysDept;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.entity.SysUserRole;
import com.nova.admin.modules.system.mapper.SysDeptMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.service.SysUserService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final SysUserRoleMapper userRoleMapper;
    private final SysDeptMapper deptMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PageResult<SysUser> getUserPage(UserPageQuery query) {
        Page<SysUser> page = new Page<>(query.getCurrent(), query.getSize());

        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
                .like(query.getAccount() != null, SysUser::getAccount, query.getAccount())
                .like(query.getNickname() != null, SysUser::getNickname, query.getNickname())
                .like(query.getPhone() != null, SysUser::getPhone, query.getPhone())
                .eq(query.getStatus() != null, SysUser::getStatus, query.getStatus())
                .eq(query.getDeptId() != null, SysUser::getDeptId, query.getDeptId())
                .ge(query.getCreateTimeStart() != null, SysUser::getCreateTime, query.getCreateTimeStart())
                .le(query.getCreateTimeEnd() != null, SysUser::getCreateTime, query.getCreateTimeEnd());

        Page<SysUser> result = (Page<SysUser>) getBaseMapper().selectUserPage(page, wrapper);

        // 联查部门名称
        List<SysUser> records = result.getRecords();
        Set<Long> deptIds = records.stream()
                .map(SysUser::getDeptId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!deptIds.isEmpty()) {
            List<SysDept> depts = deptMapper.selectBatchIds(deptIds);
            Map<Long, String> deptNameMap = depts.stream()
                    .collect(Collectors.toMap(SysDept::getId, SysDept::getName));
            for (SysUser user : records) {
                if (user.getDeptId() != null) {
                    user.setDeptName(deptNameMap.get(user.getDeptId()));
                }
            }
        }

        // 批量填充用户角色 ID 列表（用于前端编辑回显）
        Set<Long> userIds = records.stream().map(SysUser::getId).collect(Collectors.toSet());
        if (!userIds.isEmpty()) {
            List<SysUserRole> userRoles = userRoleMapper.selectList(
                    new LambdaQueryWrapper<SysUserRole>().in(SysUserRole::getUserId, userIds)
            );
            Map<Long, List<Long>> userRoleMap = userRoles.stream()
                    .collect(Collectors.groupingBy(
                            SysUserRole::getUserId,
                            Collectors.mapping(SysUserRole::getRoleId, Collectors.toList())
                    ));
            for (SysUser user : records) {
                user.setRoleIds(userRoleMap.getOrDefault(user.getId(), List.of()));
            }
        }

        return PageResult.of(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createUser(UserCreateRequest req) {
        // 自动生成唯一账号
        String account = generateUniqueAccount();

        SysUser user = new SysUser();
        user.setAccount(account);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setNickname(req.getNickname());
        user.setRealName(req.getRealName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setGender(req.getGender());
        user.setDeptId(req.getDeptId());
        user.setStatus(req.getStatus());
        user.setSuperAdmin(0);

        Long userId = SecurityUtils.requireUserId();
        user.setCreateBy(userId);
        user.setUpdateBy(userId);

        save(user);

        // 保存用户角色关联
        saveUserRoles(user.getId(), req.getRoleIds());

        log.info("创建用户成功，id={}, account={}, operator={}", user.getId(), user.getAccount(), userId);
        return user.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(UserUpdateRequest req) {
        // 检查存在
        SysUser existing = getById(req.getId());
        if (existing == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }

        SysUser user = new SysUser();
        user.setId(req.getId());
        user.setNickname(req.getNickname());
        user.setRealName(req.getRealName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setGender(req.getGender());
        user.setDeptId(req.getDeptId());
        user.setStatus(req.getStatus());

        Long operatorId = SecurityUtils.requireUserId();
        user.setUpdateBy(operatorId);

        updateById(user);

        // 更新角色关联（先删后插）
        if (req.getRoleIds() != null) {
            userRoleMapper.delete(new LambdaQueryWrapper<SysUserRole>()
                    .eq(SysUserRole::getUserId, req.getId()));
            saveUserRoles(req.getId(), req.getRoleIds());
        }

        log.info("更新用户成功，id={}, operator={}", req.getId(), operatorId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUser(Long id) {
        // 检查存在
        SysUser existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }

        // 逻辑删除
        removeById(id);

        // 删除用户角色关联
        userRoleMapper.delete(new LambdaQueryWrapper<SysUserRole>()
                .eq(SysUserRole::getUserId, id));

        Long operatorId = SecurityUtils.requireUserId();
        log.info("删除用户成功，id={}, operator={}", id, operatorId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(Long id, String newPassword) {
        // 检查存在
        SysUser existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }

        SysUser user = new SysUser();
        user.setId(id);
        user.setPassword(passwordEncoder.encode(newPassword));

        Long operatorId = SecurityUtils.requireUserId();
        user.setUpdateBy(operatorId);

        updateById(user);
        log.info("重置用户密码成功，id={}, operator={}", id, operatorId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        // 检查存在
        SysUser existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }

        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);

        Long operatorId = SecurityUtils.requireUserId();
        user.setUpdateBy(operatorId);

        updateById(user);
        log.info("更新用户状态成功，id={}, status={}, operator={}", id, status, operatorId);
    }

    // ==================== 私有方法 ====================

    /**
     * 随机生成唯一账号（8位纯数字，类似 QQ 号，冲突时重试）
     */
    private String generateUniqueAccount() {
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 20; i++) {
            // 10000000 ~ 99999999，共 8 位
            String candidate = String.valueOf(10000000 + random.nextInt(90000000));
            long count = count(new LambdaQueryWrapper<SysUser>().eq(SysUser::getAccount, candidate));
            if (count == 0) {
                return candidate;
            }
        }
        throw new BizException(ResultCode.INTERNAL_ERROR);
    }

    /**
     * 保存用户角色关联
     */
    private void saveUserRoles(Long userId, List<Long> roleIds) {
        if (roleIds != null && !roleIds.isEmpty()) {
            for (Long roleId : roleIds) {
                SysUserRole userRole = new SysUserRole();
                userRole.setUserId(userId);
                userRole.setRoleId(roleId);
                userRoleMapper.insert(userRole);
            }
        }
    }
}