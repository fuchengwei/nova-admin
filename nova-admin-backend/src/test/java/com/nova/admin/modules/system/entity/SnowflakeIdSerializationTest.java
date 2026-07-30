package com.nova.admin.modules.system.entity;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.monitor.dto.OnlineUser;
import com.nova.admin.modules.system.dto.DeptTreeDTO;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.RoleDetailDTO;
import com.nova.admin.modules.system.dto.UserInfoDTO;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SnowflakeIdSerializationTest {

    private static final long SNOWFLAKE_ID = 2082674922291187700L;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serialize_entityIds_asStrings() throws Exception {
        SysUser user = new SysUser();
        user.setId(SNOWFLAKE_ID);
        user.setDeptId(SNOWFLAKE_ID);
        user.setRoleIds(List.of(SNOWFLAKE_ID));
        user.setPassword("hashed-password");
        user.setDeleted(0);

        SysDept dept = new SysDept();
        dept.setId(SNOWFLAKE_ID);
        dept.setParentId(SNOWFLAKE_ID);

        SysMenu menu = new SysMenu();
        menu.setId(SNOWFLAKE_ID);
        menu.setParentId(SNOWFLAKE_ID);

        SysFile file = new SysFile();
        file.setId(SNOWFLAKE_ID);
        file.setUploaderId(SNOWFLAKE_ID);

        assertIdFields(objectMapper.valueToTree(user), "id", "deptId");
        assertThat(objectMapper.valueToTree(user).get("roleIds").get(0).isTextual()).isTrue();
        assertThat(objectMapper.valueToTree(user).has("password")).isFalse();
        assertThat(objectMapper.valueToTree(user).has("deleted")).isFalse();
        assertIdFields(objectMapper.valueToTree(dept), "id", "parentId");
        assertIdFields(objectMapper.valueToTree(menu), "id", "parentId");
        assertIdFields(objectMapper.valueToTree(file), "id", "uploaderId");

        PageResult<SysUser> page = PageResult.of(1L, 1L, 10L, List.of(user));
        JsonNode response = objectMapper.valueToTree(R.ok(page));
        assertThat(response.get("data").get("records").get(0).get("id").isTextual()).isTrue();
    }

    @Test
    void serialize_dtoIds_asStrings() throws Exception {
        DeptTreeDTO dept = DeptTreeDTO.builder().id(SNOWFLAKE_ID).parentId(SNOWFLAKE_ID).build();
        MenuTreeDTO menu = MenuTreeDTO.builder().id(SNOWFLAKE_ID).parentId(SNOWFLAKE_ID).build();
        RoleDetailDTO role = RoleDetailDTO.builder().id(SNOWFLAKE_ID).menuIds(List.of(SNOWFLAKE_ID)).build();
        UserInfoDTO user = UserInfoDTO.builder().id(SNOWFLAKE_ID).deptId(SNOWFLAKE_ID).build();
        OnlineUser onlineUser = new OnlineUser();
        onlineUser.setDeptId(SNOWFLAKE_ID);

        assertIdFields(objectMapper.valueToTree(dept), "id", "parentId");
        assertIdFields(objectMapper.valueToTree(menu), "id", "parentId");
        assertIdFields(objectMapper.valueToTree(role), "id");
        assertThat(objectMapper.valueToTree(role).get("menuIds").get(0).isTextual()).isTrue();
        assertIdFields(objectMapper.valueToTree(user), "id", "deptId");
        assertIdFields(objectMapper.valueToTree(onlineUser), "deptId");
    }

    @Test
    void serialize_jobId_asString() {
        SysJob job = new SysJob();
        job.setId(SNOWFLAKE_ID);

        assertThat(objectMapper.valueToTree(job).get("id").isTextual()).isTrue();
    }

    private void assertIdFields(JsonNode node, String... fields) {
        for (String field : fields) {
            assertThat(node.get(field).isTextual()).as(field).isTrue();
        }
    }
}
