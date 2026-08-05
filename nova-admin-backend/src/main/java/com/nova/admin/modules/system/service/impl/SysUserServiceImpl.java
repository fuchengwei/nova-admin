package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.constant.Constants;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.modules.system.dto.UserCreateRequest;
import com.nova.admin.modules.system.dto.UserImportResultDTO;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.dto.UserUpdateRequest;
import com.nova.admin.modules.system.entity.SysDept;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.entity.SysUserApiPermission;
import com.nova.admin.modules.system.entity.SysUserRole;
import com.nova.admin.modules.system.mapper.SysDeptMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.mapper.SysUserApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.service.SysConfigService;
import com.nova.admin.modules.system.service.SysUserService;
import com.nova.admin.modules.system.service.UserExcelCodec;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * 用户 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final SysUserRoleMapper userRoleMapper;
    private final SysUserApiPermissionMapper userApiPermissionMapper;
    private final SysDeptMapper deptMapper;
    private final SysRoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final SysConfigService sysConfigService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public PageResult<SysUser> getUserPage(UserPageQuery query) {
        Page<SysUser> page = new Page<>(query.getCurrent(), query.getSize());

        Page<SysUser> result = (Page<SysUser>) getBaseMapper().selectUserPage(page, query);

        List<SysUser> records = result.getRecords();
        enrichUsers(records);

        return PageResult.of(result);
    }

    @Override
    public byte[] exportUsers(UserPageQuery query) {
        List<SysUser> users = getBaseMapper().selectUserList(query);
        enrichUsers(users);
        UserImportOptions options = loadUserImportOptions();
        List<UserExcelCodec.UserRow> rows = users.stream()
                .map(user -> new UserExcelCodec.UserRow(
                        value(user.getAccount()), value(user.getNickname()), value(user.getRealName()),
                        value(user.getEmail()), value(user.getPhone()), genderLabel(user.getGender()),
                        options.departmentLabels().getOrDefault(user.getDeptId(), ""), statusLabel(user.getStatus()),
                        user.getRoleIds().stream()
                                .map(options.roleLabels()::get)
                                .filter(Objects::nonNull)
                                .collect(Collectors.joining(","))
                ))
                .toList();
        return UserExcelCodec.export(rows);
    }

    @Override
    public byte[] userImportTemplate() {
        UserImportOptions options = loadUserImportOptions();
        return UserExcelCodec.template(
                new ArrayList<>(options.departmentLabels().values()),
                new ArrayList<>(options.roleLabels().values())
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserImportResultDTO importUsers(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "导入文件不能为空");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new BizException(ResultCode.BAD_REQUEST, "导入文件不能超过10MB");
        }
        List<UserExcelCodec.UserRow> rows;
        try {
            rows = UserExcelCodec.parse(file.getBytes());
        } catch (IOException | IllegalArgumentException ex) {
            throw new BizException(ResultCode.BAD_REQUEST, ex.getMessage());
        }
        if (rows.size() > 1000) {
            throw new BizException(ResultCode.BAD_REQUEST, "单次最多导入1000个用户");
        }

        UserImportResultDTO result = new UserImportResultDTO();
        result.setTotal(rows.size());
        result.setErrors(new ArrayList<>());
        Long operatorId = SecurityUtils.requireUserId();
        Set<String> importedAccounts = new HashSet<>();
        String initialPassword = sysConfigService.getUserImportInitialPassword();
        sysConfigService.validatePassword(initialPassword);
        UserImportOptions options = loadUserImportOptions();
        for (int index = 0; index < rows.size(); index++) {
            try {
                importUser(rows.get(index), initialPassword, operatorId, importedAccounts, options);
                result.setSuccess(result.getSuccess() + 1);
            } catch (BizException ex) {
                result.setFailed(result.getFailed() + 1);
                if (result.getErrors().size() < 100) {
                    result.getErrors().add("第" + (index + 2) + "行：" + ex.getMessage());
                }
            }
        }
        log.info("批量导入用户完成，total={}, success={}, failed={}, operator={}",
                result.getTotal(), result.getSuccess(), result.getFailed(), operatorId);
        return result;
    }

    private void enrichUsers(List<SysUser> records) {
        Set<Long> deptIds = records.stream()
                .map(SysUser::getDeptId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!deptIds.isEmpty()) {
            List<SysDept> depts = deptMapper.selectList(
                    new LambdaQueryWrapper<SysDept>().in(SysDept::getId, deptIds));
            Map<Long, String> deptNameMap = depts.stream()
                    .collect(Collectors.toMap(SysDept::getId, SysDept::getName));
            for (SysUser user : records) {
                if (user.getDeptId() != null) {
                    user.setDeptName(deptNameMap.get(user.getDeptId()));
                }
            }
        }

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

    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createUser(UserCreateRequest req) {
        // 自动生成唯一账号
        String account = generateUniqueAccount();

        sysConfigService.validatePassword(req.getPassword());

        SysUser user = new SysUser();
        user.setAccount(account);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setForcePasswordChange(1);
        user.setPasswordChangedAt(LocalDateTime.now());
        populateUserFields(user, req.getNickname(), req.getRealName(), req.getEmail(),
                req.getPhone(), req.getGender(), req.getDeptId(), req.getStatus());
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
        populateUserFields(user, req.getNickname(), req.getRealName(), req.getEmail(),
                req.getPhone(), req.getGender(), req.getDeptId(), req.getStatus());

        Long operatorId = SecurityUtils.requireUserId();
        user.setUpdateBy(operatorId);

        updateById(user);

        // 更新角色关联（先删后插）
        if (req.getRoleIds() != null) {
            userRoleMapper.delete(new LambdaQueryWrapper<SysUserRole>()
                    .eq(SysUserRole::getUserId, req.getId()));
            saveUserRoles(req.getId(), req.getRoleIds());
        }

        if (Integer.valueOf(0).equals(req.getStatus()) || Integer.valueOf(0).equals(existing.getStatus())) {
            eventPublisher.publishEvent(AuthorizationChangedEvent.revokeSessionsOf(req.getId()));
        } else {
            eventPublisher.publishEvent(AuthorizationChangedEvent.permissionsOf(req.getId()));
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
        userApiPermissionMapper.delete(new LambdaQueryWrapper<SysUserApiPermission>()
                .eq(SysUserApiPermission::getUserId, id));

        eventPublisher.publishEvent(AuthorizationChangedEvent.revokeSessionsOf(id));

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

        sysConfigService.validatePassword(newPassword);

        SysUser user = new SysUser();
        user.setId(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForcePasswordChange(1);
        user.setPasswordChangedAt(LocalDateTime.now());

        Long operatorId = SecurityUtils.requireUserId();
        user.setUpdateBy(operatorId);

        updateById(user);
        eventPublisher.publishEvent(AuthorizationChangedEvent.revokeSessionsOf(id));
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
        if (Integer.valueOf(0).equals(status)) {
            eventPublisher.publishEvent(AuthorizationChangedEvent.revokeSessionsOf(id));
        } else {
            eventPublisher.publishEvent(AuthorizationChangedEvent.permissionsOf(id));
        }
        log.info("更新用户状态成功，id={}, status={}, operator={}", id, status, operatorId);
    }

    // ==================== 私有方法 ====================

    private void importUser(UserExcelCodec.UserRow row, String initialPassword, Long operatorId,
                            Set<String> importedAccounts, UserImportOptions options) {
        String account = trim(row.account());
        if (account.isBlank()) {
            throw new BizException(ResultCode.BAD_REQUEST, "账号不能为空");
        }
        if (!account.matches("^[\\p{L}\\p{N}._-]{1,64}$")) {
            throw new BizException(ResultCode.BAD_REQUEST, "账号仅支持字母、数字、点、下划线和短横线");
        }
        if (getBaseMapper().selectByAccount(account) != null) {
            throw new BizException(ResultCode.DATA_EXISTS, "账号已存在");
        }
        String nickname = trim(row.nickname());
        if (nickname.isBlank()) {
            throw new BizException(ResultCode.BAD_REQUEST, "昵称不能为空");
        }
        validateLength(nickname, 64, "昵称");
        validateLength(trim(row.realName()), 64, "姓名");

        String email = trim(row.email());
        if (!email.matches(Constants.EMAIL_PATTERN)) {
            throw new BizException(ResultCode.BAD_REQUEST, "邮箱格式不正确");
        }
        String phone = trim(row.phone());
        if (!phone.matches(Constants.PHONE_PATTERN)) {
            throw new BizException(ResultCode.BAD_REQUEST, "手机号格式不正确");
        }

        Integer gender = parseGender(row.gender());
        Integer status = parseStatus(row.status());
        Long deptId = parseChoice(row.department(), options.departmentIds(), "部门");
        List<Long> roleIds = parseChoices(row.roles(), options.roleIds(), "角色");
        if (!importedAccounts.add(account)) {
            throw new BizException(ResultCode.DATA_EXISTS, "账号已存在");
        }

        SysUser user = new SysUser();
        user.setAccount(account);
        user.setPassword(passwordEncoder.encode(initialPassword));
        user.setForcePasswordChange(1);
        user.setPasswordChangedAt(LocalDateTime.now());
        populateUserFields(user, nickname, trim(row.realName()), email, phone,
                gender, deptId, status);
        user.setSuperAdmin(0);
        user.setCreateBy(operatorId);
        user.setUpdateBy(operatorId);
        save(user);
        saveUserRoles(user.getId(), roleIds);
        }
    private Integer parseGender(String value) {
        String trimmed = trim(value);
        if (trimmed.isBlank()) {
            return 0;
        }
        return switch (trimmed) {
            case "未知", "0" -> 0;
            case "男", "1" -> 1;
            case "女", "2" -> 2;
            default -> throw new BizException(ResultCode.BAD_REQUEST, "性别仅支持未知、男或女");
        };
    }

    private Integer parseStatus(String value) {
        String trimmed = trim(value);
        if (trimmed.isBlank()) {
            return 1;
        }
        return switch (trimmed) {
            case "启用", "1" -> 1;
            case "停用", "0" -> 0;
            default -> throw new BizException(ResultCode.BAD_REQUEST, "状态仅支持启用或停用");
        };
    }

    private Long parseChoice(String value, Map<String, Long> choices, String field) {
        String trimmed = trim(value);
        if (trimmed.isBlank()) {
            return null;
        }
        Long id = choices.get(trimmed);
        if (id == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, field + "不存在或已停用");
        }
        return id;
    }

    private List<Long> parseChoices(String value, Map<String, Long> choices, String field) {
        String trimmed = trim(value).replace('，', ',');
        if (trimmed.isBlank()) {
            return List.of();
        }
        List<Long> roleIds = new ArrayList<>();
        for (String choice : trimmed.split(",")) {
            Long id = parseChoice(choice, choices, field);
            if (!roleIds.contains(id)) {
                roleIds.add(id);
            }
        }
        return roleIds;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private void validateLength(String value, int maxLength, String field) {
        if (value.length() > maxLength) {
            throw new BizException(ResultCode.BAD_REQUEST, field + "长度不能超过" + maxLength + "个字符");
        }
    }

    private UserImportOptions loadUserImportOptions() {
        List<SysDept> allDepts = deptMapper.selectListBySortOrder();
        Map<Long, SysDept> deptById = allDepts.stream()
                .collect(Collectors.toMap(SysDept::getId, dept -> dept));
        Map<Long, String> departmentLabels = new LinkedHashMap<>();
        Map<String, Long> departmentIds = new HashMap<>();
        allDepts.stream()
                .filter(dept -> Integer.valueOf(1).equals(dept.getStatus()))
                .forEach(dept -> {
                    String label = departmentLabel(dept, deptById);
                    departmentLabels.put(dept.getId(), label);
                    departmentIds.put(label, dept.getId());
                });

        List<SysRole> roles = roleMapper.selectList(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getStatus, 1)
                .orderByAsc(SysRole::getSort));
        Map<Long, String> roleLabels = new LinkedHashMap<>();
        Map<String, Long> roleIds = new HashMap<>();
        roles.forEach(role -> {
            String label = roleLabel(role);
            roleLabels.put(role.getId(), label);
            roleIds.put(label, role.getId());
        });
        return new UserImportOptions(departmentLabels, departmentIds, roleLabels, roleIds);
    }

    private String departmentLabel(SysDept dept, Map<Long, SysDept> deptById) {
        List<String> names = new ArrayList<>();
        Set<Long> visited = new HashSet<>();
        SysDept current = dept;
        while (current != null && visited.add(current.getId())) {
            names.add(current.getName());
            current = current.getParentId() == null || current.getParentId() == 0
                    ? null
                    : deptById.get(current.getParentId());
        }
        Collections.reverse(names);
        return String.join(" / ", names);
    }

    private String roleLabel(SysRole role) {
        return role.getName() + "（" + role.getCode() + "）";
    }

    private String genderLabel(Integer gender) {
        return switch (gender == null ? 0 : gender) {
            case 1 -> "男";
            case 2 -> "女";
            default -> "未知";
        };
    }

    private String statusLabel(Integer status) {
        return Integer.valueOf(1).equals(status) ? "启用" : "停用";
    }

    private String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private record UserImportOptions(Map<Long, String> departmentLabels, Map<String, Long> departmentIds,
                                     Map<Long, String> roleLabels, Map<String, Long> roleIds) {
    }

    /**
     * 填充用户字段
     */
    private void populateUserFields(SysUser user, String nickname, String realName, String email,
                                    String phone, Integer gender, Long deptId, Integer status) {
        user.setNickname(nickname);
        user.setRealName(realName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setGender(gender);
        user.setDeptId(deptId);
        user.setStatus(status);
    }

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
