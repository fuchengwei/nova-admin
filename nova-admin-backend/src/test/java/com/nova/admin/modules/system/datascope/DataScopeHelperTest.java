package com.nova.admin.modules.system.datascope;

import com.nova.admin.modules.system.service.SysDeptService;
import com.nova.admin.security.LoginUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.LinkedHashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class DataScopeHelperTest {

    @Mock
    private SysDeptService deptService;

    @org.mockito.InjectMocks
    private DataScopeHelper helper;

    @Test
    void buildScopeSql_whenCustomScope_returnsSelectedDepartments() throws Exception {
        LoginUser user = LoginUser.builder()
                .userId(7L)
                .dataScope(6)
                .customDeptIds(new LinkedHashSet<>(List.of(10L, 11L)))
                .build();

        String sql = helper.buildScopeSql(user, queryAnnotation());

        assertThat(sql).isEqualTo("u.dept_id IN (10,11)");
    }

    @Test
    void buildScopeSql_whenFixedAndCustomScopesExist_returnsUnionCondition() throws Exception {
        given(deptService.findSelfAndDescendantIds(3L)).willReturn(List.of(3L, 4L));
        LoginUser user = LoginUser.builder()
                .userId(7L)
                .deptId(3L)
                .dataScope(2)
                .customDeptIds(new LinkedHashSet<>(List.of(10L)))
                .build();

        String sql = helper.buildScopeSql(user, queryAnnotation());

        assertThat(sql).isEqualTo("(u.dept_id IN (3,4) OR u.dept_id IN (10))");
    }

    @Test
    void buildScopeSql_whenAllScopeExists_ignoresCustomDepartments() throws Exception {
        LoginUser user = LoginUser.builder()
                .dataScope(1)
                .customDeptIds(new LinkedHashSet<>(List.of(10L)))
                .build();

        assertThat(helper.buildScopeSql(user, queryAnnotation())).isNull();
    }

    @Test
    void buildScopeSql_whenCustomScopeHasNoDepartments_deniesAllRows() throws Exception {
        LoginUser user = LoginUser.builder().dataScope(6).customDeptIds(new LinkedHashSet<>()).build();

        assertThat(helper.buildScopeSql(user, queryAnnotation())).isEqualTo("1=0");
    }

    private DataScope queryAnnotation() throws Exception {
        Method method = TestMapper.class.getDeclaredMethod("query");
        return method.getAnnotation(DataScope.class);
    }

    private static final class TestMapper {
        @DataScope(deptAlias = "u", userAlias = "u")
        private void query() {
        }
    }
}
