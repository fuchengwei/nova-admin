package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.dto.DeptCreateRequest;
import com.nova.admin.modules.system.dto.DeptTreeDTO;
import com.nova.admin.modules.system.dto.DeptUpdateRequest;
import com.nova.admin.modules.system.entity.SysDept;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysDeptMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.SysDeptService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 部门 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysDeptServiceImpl extends ServiceImpl<SysDeptMapper, SysDept> implements SysDeptService {

    private final SysUserMapper sysUserMapper;

    @Override
    public List<DeptTreeDTO> getDeptTree() {
        List<SysDept> allDepts = baseMapper.selectListBySortOrder();
        return buildTree(allDepts);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createDept(DeptCreateRequest req) {
        // 检查同 parent_id 下 name 是否重复
        checkDeptNameUnique(null, req.getParentId(), req.getName());

        SysDept dept = new SysDept();
        populateDeptFields(dept, req.getParentId(), req.getName(), req.getCode(),
                req.getLeader(), req.getPhone(), req.getEmail(), req.getSort(), req.getStatus());

        // 手动填充 createBy / updateBy
        Long userId = SecurityUtils.requireUserId();
        dept.setCreateBy(userId);
        dept.setUpdateBy(userId);

        save(dept);
        log.info("创建部门成功，id={}, name={}, operator={}", dept.getId(), dept.getName(), userId);
        return dept.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateDept(DeptUpdateRequest req) {
        // 检查存在
        SysDept existing = getById(req.getId());
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "部门不存在");
        }

        // 检查同 parent_id 下 name 是否重复（排除自身）
        checkDeptNameUnique(req.getId(), req.getParentId(), req.getName());

        // 检查 parent_id 不能设为自己或自己的子节点
        if (req.getParentId().equals(req.getId())) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "父部门不能设为自身");
        }
        if (isChildDept(req.getId(), req.getParentId())) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "父部门不能设为自己的子部门");
        }

        SysDept dept = new SysDept();
        dept.setId(req.getId());
        populateDeptFields(dept, req.getParentId(), req.getName(), req.getCode(),
                req.getLeader(), req.getPhone(), req.getEmail(), req.getSort(), req.getStatus());

        // 手动填充 updateBy
        Long userId = SecurityUtils.requireUserId();
        dept.setUpdateBy(userId);

        updateById(dept);
        log.info("更新部门成功，id={}, operator={}", req.getId(), userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDept(Long id) {
        // 检查存在
        SysDept existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "部门不存在");
        }

        // 检查是否有子部门
        long childCount = count(new LambdaQueryWrapper<SysDept>()
                .eq(SysDept::getParentId, id));
        if (childCount > 0) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "该部门下存在子部门，无法删除");
        }

        // 检查是否有关联用户
        long userCount = sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getDeptId, id));
        if (userCount > 0) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "该部门下存在关联用户，无法删除");
        }

        // 逻辑删除
        removeById(id);
        Long userId = SecurityUtils.requireUserId();
        log.info("删除部门成功，id={}, operator={}", id, userId);
    }

    @Override
    public List<DeptTreeDTO> getDeptTreeExclude(Long excludeId) {
        List<SysDept> allDepts = baseMapper.selectListBySortOrder();

        // 收集 excludeId 及其所有子节点 ID
        Set<Long> excludeIds = new HashSet<>();
        collectChildIds(allDepts, excludeId, excludeIds);
        excludeIds.add(excludeId);

        // 过滤掉排除的节点
        List<SysDept> filtered = allDepts.stream()
                .filter(d -> !excludeIds.contains(d.getId()))
                .toList();

        return buildTree(filtered);
    }

    @Override
    public List<Long> findSelfAndDescendantIds(Long deptId) {
        List<SysDept> allDepts = baseMapper.selectListBySortOrder();
        Map<Long, List<Long>> childrenMap = allDepts.stream()
                .filter(d -> d.getParentId() != null)
                .collect(Collectors.groupingBy(
                        SysDept::getParentId,
                        Collectors.mapping(SysDept::getId, Collectors.toList())));
        List<Long> result = new ArrayList<>();
        if (deptId != null) {
            Deque<Long> queue = new ArrayDeque<>();
            queue.add(deptId);
            while (!queue.isEmpty()) {
                Long current = queue.poll();
                result.add(current);
                List<Long> children = childrenMap.get(current);
                if (children != null) {
                    queue.addAll(children);
                }
            }
        }
        return result;
    }

    // ==================== 私有方法 ====================

    /**
     * 填充部门字段
     */
    private void populateDeptFields(SysDept dept, Long parentId, String name, String code,
                                     String leader, String phone, String email, Integer sort, Integer status) {
        dept.setParentId(parentId);
        dept.setName(name);
        dept.setCode(code);
        dept.setLeader(leader);
        dept.setPhone(phone);
        dept.setEmail(email);
        dept.setSort(sort != null ? sort : 0);
        dept.setStatus(status);
    }

    /**
     * 检查同 parent_id 下部门名称是否重复
     *
     * @param excludeId 排除的部门ID（更新时排除自身，创建时传 null）
     * @param parentId  父部门ID
     * @param name      部门名称
     */
    private void checkDeptNameUnique(Long excludeId, Long parentId, String name) {
        LambdaQueryWrapper<SysDept> wrapper = new LambdaQueryWrapper<SysDept>()
                .eq(SysDept::getParentId, parentId)
                .eq(SysDept::getName, name);
        if (excludeId != null) {
            wrapper.ne(SysDept::getId, excludeId);
        }
        long count = count(wrapper);
        if (count > 0) {
            throw new BizException(ResultCode.DATA_EXISTS, "同级下已存在相同名称的部门");
        }
    }

    /**
     * 判断 targetId 是否是 deptId 的子部门（递归）
     */
    private boolean isChildDept(Long deptId, Long targetId) {
        List<SysDept> allDepts = baseMapper.selectListBySortOrder();
        Set<Long> childIds = new HashSet<>();
        collectChildIds(allDepts, deptId, childIds);
        return childIds.contains(targetId);
    }

    /**
     * 递归收集某节点下所有子节点 ID
     */
    private void collectChildIds(List<SysDept> allDepts, Long parentId, Set<Long> childIds) {
        Map<Long, List<SysDept>> parentMap = allDepts.stream()
                .collect(Collectors.groupingBy(SysDept::getParentId));
        collectChildIdsRecursive(parentMap, parentId, childIds);
    }

    private void collectChildIdsRecursive(Map<Long, List<SysDept>> parentMap, Long parentId, Set<Long> childIds) {
        List<SysDept> children = parentMap.get(parentId);
        if (children == null || children.isEmpty()) {
            return;
        }
        for (SysDept child : children) {
            childIds.add(child.getId());
            collectChildIdsRecursive(parentMap, child.getId(), childIds);
        }
    }

    /**
     * 组装树形结构
     */
    private List<DeptTreeDTO> buildTree(List<SysDept> allDepts) {
        // 转换为 DTO
        List<DeptTreeDTO> dtoList = allDepts.stream()
                .map(this::toDTO)
                .toList();

        // 按 parentId 分组
        Map<Long, List<DeptTreeDTO>> parentMap = dtoList.stream()
                .collect(Collectors.groupingBy(DeptTreeDTO::getParentId));

        // 为每个节点设置 children
        for (DeptTreeDTO dto : dtoList) {
            dto.setChildren(parentMap.getOrDefault(dto.getId(), new ArrayList<>()));
        }

        // 根节点 parentId == 0
        return parentMap.getOrDefault(0L, new ArrayList<>());
    }

    /**
     * SysDept 转 DeptTreeDTO
     */
    private DeptTreeDTO toDTO(SysDept dept) {
        return DeptTreeDTO.builder()
                .id(dept.getId())
                .parentId(dept.getParentId())
                .name(dept.getName())
                .code(dept.getCode())
                .leader(dept.getLeader())
                .phone(dept.getPhone())
                .email(dept.getEmail())
                .sort(dept.getSort())
                .status(dept.getStatus())
                .createTime(dept.getCreateTime())
                .build();
    }
}
