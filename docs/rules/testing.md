# 测试规范

> 适用范围：前端 `nova-admin-frontend`、后端 `nova-admin-backend`
> 原则：**新增非平凡逻辑必须有对应测试**；测试与功能代码同步提交。

## 1. 后端测试（JUnit 5 + Spring Boot Test）

### 1.1 测试框架

| 依赖 | 用途 |
|---|---|
| JUnit 5 (`junit-jupiter`) | 测试框架 |
| Spring Boot Test | 切片测试 / 集成测试 |
| Mockito | Mock 依赖 |
| AssertJ | 流式断言 |
| H2 / Testcontainers | 测试数据库 |

### 1.2 测试分类与选择

| 测试类型 | 注解 | 适用场景 |
|---|---|---|
| 单元测试 | 无 Spring 注解，纯 Mockito | Service 层纯业务逻辑 |
| 切片测试（Mapper） | `@MybatisPlusTest` / `@DataJpaTest` | Mapper 方法、SQL 正确性 |
| 切片测试（Controller） | `@WebMvcTest` | Controller 参数校验、权限注解 |
| 集成测试 | `@SpringBootTest` | 端到端流程（慎用，启动慢） |

**优先单元测试 → 切片测试 → 集成测试**，慎用 `@SpringBootTest`（仅安全流程、事务边界等必须时使用）。

### 1.3 Service 单元测试示例

```java
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @InjectMocks
    private UserServiceImpl userService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private UserConverter userConverter;

    @Test
    void getById_whenUserExists_returnsDTO() {
        // Arrange
        SysUser user = new SysUser();
        user.setId(1L);
        user.setUsername("zhangsan");
        UserDTO dto = new UserDTO();
        dto.setUsername("zhangsan");
        given(userMapper.selectById(1L)).willReturn(user);
        given(userConverter.toDTO(user)).willReturn(dto);

        // Act
        UserDTO result = userService.getById(1L);

        // Assert
        assertThat(result.getUsername()).isEqualTo("zhangsan");
    }

    @Test
    void getById_whenUserNotFound_throwsBizException() {
        given(userMapper.selectById(anyLong())).willReturn(null);

        assertThatThrownBy(() -> userService.getById(999L))
            .isInstanceOf(BizException.class)
            .extracting("code")
            .isEqualTo(ResultCode.USER_NOT_FOUND.getCode());
    }
}
```

### 1.4 必须有测试的场景

- Service 层所有包含条件分支的业务方法
- `@DataScope` 数据权限逻辑
- 安全流程（JWT 验证、token 刷新、登录失败计数）
- 自定义 `@PreAuthorize` 权限校验（切片测试）
- 复杂 SQL 的 Mapper 方法

### 1.5 测试文件位置

```
src/test/java/com/nova/admin/
├── modules/
│   └── system/
│       └── service/
│           └── UserServiceImplTest.java
└── security/
    └── JwtAuthFilterTest.java
```

## 2. 前端测试（Vitest + React Testing Library）

> 当前测试环境**尚未配置**，以下为搭建后采用的规范。

### 2.1 测试框架

| 依赖 | 用途 |
|---|---|
| `vitest` | 测试运行器（与 Vite 原生集成） |
| `@testing-library/react` | 组件渲染与交互 |
| `@testing-library/user-event` | 模拟用户事件 |
| `@testing-library/jest-dom` | 扩展断言（`toBeInTheDocument` 等） |
| `msw` | Mock Service Worker（API Mock） |

### 2.2 测试分类

| 类型 | 测试对象 | 优先级 |
|---|---|---|
| 单元测试 | `src/utils/`、`src/hooks/` | 🔴 高 |
| 组件测试 | 关键交互组件（表单校验、弹窗开关） | 🟡 中 |
| 集成测试 | 页面级（ProTable + ModalForm 完整流程） | 🟢 低 |

### 2.3 工具函数测试示例

```ts
// src/utils/tree.test.ts
import { describe, it, expect } from 'vitest';
import { toTreeSelectData } from './tree';

describe('toTreeSelectData', () => {
  it('converts flat list to tree structure', () => {
    const input = [
      { id: 1, name: '技术部', parentId: 0 },
      { id: 2, name: '前端组', parentId: 1 },
    ];
    const result = toTreeSelectData(input, { idKey: 'id', parentKey: 'parentId', labelKey: 'name' });
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
  });
});
```

### 2.4 自定义 Hook 测试示例

```ts
// src/hooks/useTableScrollY.test.ts
import { renderHook } from '@testing-library/react';
import { useTableScrollY } from './useTableScrollY';

it('returns a scrollY value and a wrapperRef', () => {
  const { result } = renderHook(() => useTableScrollY());
  expect(result.current.wrapperRef).toBeDefined();
  expect(typeof result.current.scrollY).toBe('number');
});
```

### 2.5 必须有测试的场景

- `src/utils/` 下所有工具函数
- 包含复杂逻辑的自定义 hook（如 `useTableScrollY`）
- 表单校验规则（`src/utils/validators.ts`）

### 2.6 测试文件位置

测试文件与源文件同目录，命名 `*.test.ts(x)`：

```
src/
├── utils/
│   ├── tree.ts
│   └── tree.test.ts        # ✅ 同目录
├── hooks/
│   ├── useTableScrollY.ts
│   └── useTableScrollY.test.ts
```

## 3. 通用原则

- **测试独立**：每个测试用例独立，不依赖其它用例的执行顺序或副作用
- **测试命名**：`<被测方法>_<场景>_<期望结果>`（如 `getById_whenUserNotFound_throwsBizException`）
- **覆盖正常路径 + 边界/异常路径**：至少各一个用例
- **禁止提交 `skip` / `todo` 的测试**（除非显式标注原因）
- **CI 必须通过**：PR 合并前测试全绿
