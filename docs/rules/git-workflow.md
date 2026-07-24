# Git 提交与分支规范

> 适用范围：整个 nova-admin 仓库

## 1. Conventional Commits 格式

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 1.1 type

| type | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响逻辑） |
| `refactor` | 重构（非 feat 非 fix） |
| `perf` | 性能优化 |
| `test` | 新增或修改测试 |
| `build` | 构建系统或依赖变更 |
| `ci` | CI/CD 配置变更 |
| `chore` | 其它杂务（不涉及源码或测试） |
| `revert` | 回滚某次提交 |

### 1.2 scope

| scope | 适用场景 |
|---|---|
| `frontend` | 前端通用改动（不属于某一模块） |
| `backend` | 后端通用改动 |
| `auth` | 登录/认证模块 |
| `user` | 用户管理 |
| `role` | 角色管理 |
| `menu` | 菜单管理 |
| `dept` | 部门管理 |
| `dict` | 字典管理 |
| `job` | 定时任务 |
| `gen` | 代码生成 |
| `infra` | 基础设施/文件 |
| `monitor` | 监控 |
| `deps` | 依赖升级 |
| `docker` | Docker/部署配置 |

### 1.3 subject

- **中文**，祈使句（如"修复"、"新增"、"重构"，非"修复了"、"已新增"）
- ≤ 50 字
- 不加结尾句号

### 1.4 body（可选）

- 说明 **why**（为什么改），而非 what（改了什么，代码本身已体现）
- 与 subject 之间空一行

### 1.5 footer（可选）

- 关联 issue：`Closes #123`
- Breaking change：`BREAKING CHANGE: 描述`

## 2. 示例

```
feat(dict): 新增字典管理页面

字典管理支持字典类型与字典数据的增删改查，
补全 zh.ts / en.ts 国际化文案，使用 ProTable + ModalForm 实现。

Closes #42
```

```
fix(auth): 修复 token 刷新并发请求时的竞态问题
```

```
refactor(frontend): 用 ProLayout 重写 AdminLayout 并落地顶部操作区
```

```
docs(rules): 补充 docs/rules 规则体系并更新 AGENTS.md 导航
```

## 3. 分支规范

| 分支类型 | 命名格式 | 示例 |
|---|---|---|
| 功能开发 | `feat/<scope>-<brief>` | `feat/dict-management` |
| Bug 修复 | `fix/<scope>-<brief>` | `fix/auth-token-race` |
| 重构 | `refactor/<scope>-<brief>` | `refactor/admin-layout` |
| 文档 | `docs/<brief>` | `docs/rules` |
| 发布 | `release/v<semver>` | `release/v1.2.0` |

- `master` 为主干，禁止直接 push；通过 PR 合并
- feature 分支开发完成后合并到 `master`，合并后删除 feature 分支

## 4. PR 规范

- PR 标题遵循 Conventional Commits 格式
- PR 描述包含：**What**（改了什么）、**Why**（为什么改）、**Test**（如何验证）
- 涉及 UI 改动的 PR 附截图
- 合并前通过 CI（lint + type-check + tests）
