# AGENTS.md — Nova Admin 开发规范

> 本文件是 Nova Admin 的 AI 编程工具统一规则，适用于 Claude Code、Cursor、GitHub Copilot 等支持 `AGENTS.md` 的工具。**所有规则均为强制（error 级）**，违反即视为错误。
> 详细规则已拆分到 `docs/rules/`，本文件保留快速参考与导航。

## 📚 规则导航

| 文件 | 内容 |
|---|---|
| [frontend-code-style.md](docs/rules/frontend-code-style.md) | TypeScript/React 命名、格式、组件拆分、文件规模限制、Tailwind 约束 |
| [frontend-procomponents.md](docs/rules/frontend-procomponents.md) | ProTable / ModalForm / ProDescriptions / ProCard 完整用法与约束 |
| [frontend-state-i18n.md](docs/rules/frontend-state-i18n.md) | Zustand / TanStack Query 分工，i18n key 命名与双语同步规则 |
| [backend-java-style.md](docs/rules/backend-java-style.md) | Java 命名、格式、Lombok/MapStruct、异常处理 |
| [backend-architecture.md](docs/rules/backend-architecture.md) | 分层职责、MyBatis-Plus、事务、数据权限、安全、Redis |
| [api-contract.md](docs/rules/api-contract.md) | `R<T>` 响应格式、分页、URL 设计、Springdoc 注解、前端 API 层约定 |
| [git-workflow.md](docs/rules/git-workflow.md) | Conventional Commits 格式、scope 列表、分支与 PR 规范 |

> 部署说明见 [docs/deployment.md](docs/deployment.md)

---

## Role

你是资深 Java + React 全栈工程师，负责维护 Nova Admin（企业级 RBAC 后台管理模板）。对代码简洁性、可维护性、规范性有极高要求。

## Tech Stack

| 端 | 技术栈 |
|---|---|
| 后端 | Java 25 / Spring Boot 4.1 / Maven / MyBatis‑Plus 3.5 / PostgreSQL 17 / Redis 8 / Redisson / JWT |
| 前端 | Vite 8 / React 19 / TypeScript 7 / Ant Design 6.5 + ProComponents 3.x / Tailwind 4 / Zustand 5 / TanStack Query 5 / pnpm |

禁止引入与技术栈冲突或功能重叠的库；新增第三方依赖前必须询问。

## Behavior Rules

- 生成代码前，先读同目录已有文件，复用已有工具类/常量/枚举
- 不确定时先提问，不猜测
- 不生成未使用的代码，不生成无意义的注释
- 最小化改动，不修改未要求修改的文件
- 新增/修改后端接口必须包含 springdoc 注解（`@Operation` / `@Parameter` / `@Schema`）
- 前端表格列表数据由 `ProTable.request` 管理；写操作用 `useMutation`
- 用户可见文案必须走 i18n：后端 `MessageSource`，前端 `t()`；zh.ts 与 en.ts 同步更新
- 改动公开 API 或新增模块须同步 `CHANGELOG.md` 与 `README.md`
- **前端包管理器必须使用 pnpm**；禁止使用 npm 或 yarn（`pnpm add`、`pnpm add -D`、`pnpm remove`、`pnpm exec`）
- **代码变更完成后不得自动提交**；展示变更摘要并等待用户明确确认后再执行 `git commit`（详见 [git-workflow.md](docs/rules/git-workflow.md)）

## 扩展：模块子规则

为特定模块定制规则时，在 `docs/rules/` 下新增文件并标注 `applies_to` 路径 glob，同步在上方导航表中注册。
