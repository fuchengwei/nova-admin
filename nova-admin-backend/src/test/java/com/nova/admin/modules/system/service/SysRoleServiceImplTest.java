package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysRoleDept;
import com.nova.admin.modules.system.entity.SysRoleMenu;
import com.nova.admin.modules.system.mapper.SysDeptMapper;
import com.nova.admin.modules.system.mapper.SysRoleDeptMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysRoleMenuMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.dto.RoleDetailDTO;
import com.nova.admin.modules.system.service.impl.SysRoleServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class SysRoleServiceImplTest {

    @Mock
    private SysRoleMapper roleMapper;

    @Mock
    private SysRoleMenuMapper roleMenuMapper;

    @Mock
    private SysRoleDeptMapper roleDeptMapper;

    @Mock
    private SysDeptMapper deptMapper;

    @Mock
    private SysUserRoleMapper userRoleMapper;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Spy
    @InjectMocks
    private SysRoleServiceImpl roleService;

    @Test
    void getRoleDetail_whenCustomDepartmentsExist_returnsDepartmentIds() {
        SysRole role = new SysRole();
        role.setId(1L);
        role.setName("运营");
        role.setCode("operator");
        role.setDataScope(6);
        org.mockito.Mockito.doReturn(role).when(roleService).getById(1L);

        SysRoleMenu roleMenu = new SysRoleMenu();
        roleMenu.setRoleId(1L);
        roleMenu.setMenuId(2L);
        given(roleMenuMapper.selectList(any())).willReturn(List.of(roleMenu));

        SysRoleDept roleDept = new SysRoleDept();
        roleDept.setRoleId(1L);
        roleDept.setDeptId(10L);
        given(roleDeptMapper.selectList(any())).willReturn(List.of(roleDept));

        RoleDetailDTO result = roleService.getRoleDetail(1L);

        assertThat(result.getDataScope()).isEqualTo(6);
        assertThat(result.getMenuIds()).containsExactly(2L);
        assertThat(result.getDeptIds()).containsExactly(10L);
    }
}
