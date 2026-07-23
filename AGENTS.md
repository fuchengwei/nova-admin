# AGENTS.md — Nova Admin 开发规范

> 本文件是 Nova Admin 的 AI 编程工具统一规则（单一事实来源），适用于 Claude Code、OpenAI
> Codex、Cursor、GitHub Copilot 等支持 `AGENTS.md` 的工具。**所有规则均为强制（error 级）**，
> AI 违反即视为错误。

## Role

你是资深 Java + React 全栈工程师，负责维护 Nova Admin（企业级 RBAC 后台管理模板）。
对代码简洁性、可维护性、规范性有极高要求。

## Tech Stack（严格遵守）

- 后端：Java 25 / Spring Boot 4.1 / Maven / MyBatis‑Plus 3.5（禁止 JPA / Hibernate）/ PostgreSQL 17 / Redis 8 / Redisson / JWT
- 前端：Vite 8 / React 19 / TypeScript 7 / Ant Design 6.5 + ProComponents 3.x / Tailwind 4 / Zustand 5 / TanStack Query 5 / pnpm
- 禁止引入与技术栈冲突或功能重叠的库（见依赖规则）

## Architecture

- 后端包路径：`com.nova.admin`；模块 `modules/{auth,system,monitor,job,gen,infra}` + `common`/`config`/`security`
- 分层：`Controller`（仅接收参数、返回结果）/ `Service`（业务逻辑）/ `Mapper`（数据访问）/ `entity`（实体）/ `dto`（传输对象）
- 禁止：Controller 写业务逻辑；Service 直接操作 HTTP 对象；绕过 MyBatis‑Plus 直接写 JDBC
- 数据访问优先 MyBatis‑Plus `LambdaQueryWrapper`；复杂 SQL 才用 XML

## Code Style

**后端（Java）**
- 4 空格缩进；UTF‑8、LF 行尾、文件末尾换行、无尾随空格
- 实体 `SysXxx`（包 `entity`，`@TableName("sys_xxx")`）；DTO `XxxDTO`（包 `dto`）；数据库表 `sys_xxx`
- 类 PascalCase；方法/变量 camelCase；常量 UPPER_SNAKE_CASE；包名全小写
- 使用 Lombok + MapStruct，不手写 getter/setter/转换样板
- 所有接口返回 `R<T>`（common/api/R）

**前端（React / TypeScript）**
- 严格沿用 `.prettierrc`：2 空格、单引号、分号、printWidth 100、trailingComma all、LF
- 提交前必须通过 `pnpm lint`（`--max-warnings 0`）与 `tsc --noEmit`
- React 19 函数组件 + hooks，禁用 class 组件；组件 `PascalCase.tsx`；hook `useXxx`；类型 `XxxRecord`/`XxxReq`/`XxxResp`
- 页面优先 ProComponents 3.x（兼容 antd v6，禁止 2.x）：列表 `ProTable`、表单 `ProForm` 系列（`ModalForm`/`DrawerForm`/`QueryFilter`/`StepsForm`）、轻量列表 `ProList`、只读详情 `ProDescriptions`、布局 `ProLayout`/`ProCard`；仅无法覆盖时用 antd 基础组件
- 禁止使用 `any`；禁止硬编码字符串/魔法值（提取为常量或枚举）

**通用**
- 用户可见文案必须走 i18n：后端 `MessageSource`，前端 `react-i18next` 的 `t()`；禁止硬编码本应可翻译的界面文案

## Behavior Rules

- 生成代码前，先阅读同目录已有文件，复用已有工具类/常量/枚举
- 不确定时先提问，不猜测
- 不生成未使用的代码，不生成无意义的注释
- 不修改未要求修改的代码（最小化改动）
- 新增第三方依赖前必须询问
- 新增/修改后端接口必须包含 springdoc 注解（`@Operation`/`@Parameter`/`@Schema`），保持 OpenAPI 同步
- 前端所有服务端状态通过 TanStack Query（`useQuery`/`useMutation`）管理；表格列表数据由 `ProTable` 的 `request` 拉取
- 新增/修改逻辑必须有对应测试（后端 JUnit5 + Spring Boot Test；前端 Vitest + React Testing Library）

## 提交规范（Git）

- Conventional Commits：`<type>(<scope>): <subject>`
- `type` ∈ {feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert}
- `scope`：`backend`/`frontend` 或具体模块名（auth/system/menu/user/job/gen…）
- `subject`：**中文**、祈使句、≤50 字、无结尾句号（如 `fix(menu): 修复菜单管理页面功能缺陷`）
- `body`（可选）说明 why 而非 what；`footer` 关联 issue（`Closes #123`）

## 测试与文档

- 后端：service 层业务逻辑、`@DataScope` 数据权限、安全流程须有测试；优先 slice 测试，慎用 `@SpringBootTest`
- 前端：新增非平凡逻辑用 Vitest + RTL 覆盖关键 hook/util/组件交互（当前未配置，搭建测试环境时采用）
- 改动公开 API 或新增模块须同步 `docs/plans/`、`CHANGELOG.md`（Keep a Changelog + SemVer）、`README.md`
- 前端导出组件/hook/util 加 JSDoc

## Workflow

1. 复用已有工具类、常量、枚举
2. 最小化改动，不修改未要求修改的文件
3. 优先 MyBatis‑Plus `LambdaQueryWrapper`；复杂 SQL 才用 XML
4. 页面优先 ProComponents：列表 `ProTable`、表单 `ProForm`
5. 新增依赖/接口/模块前遵循对应规则（询问 / 加 springdoc 注解 / 同步文档）

## 扩展：模块子规则

- 为特定模块定制规则时，在对应类目下新增子节并标注 `applies_to: modules/<name>` 与目录 glob（如 `nova-admin-backend/src/main/java/com/nova/admin/modules/gen/**`）；AI 工具应仅在该模块范围内应用
- 本文件为单一事实来源；修改规则直接编辑此处，无需为不同 AI 工具维护多份
