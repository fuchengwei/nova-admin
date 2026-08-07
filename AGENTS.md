# AGENTS.md — Nova Admin 开发入口

> 本文件是 Nova Admin 的 AI 编程入口。详细规则按主题维护在 `docs/rules/`，不要在本文件复制完整实现规范。

## 📚 规则导航

| 文件 | 内容 |
|---|---|
| [00-project.md](docs/rules/00-project.md) | 全局边界、依赖、i18n、文档同步和变更原则 |
| [10-backend.md](docs/rules/10-backend.md) | Java、分层、MyBatis-Plus、事务、安全、数据权限和存储 |
| [20-frontend.md](docs/rules/20-frontend.md) | TypeScript/React、状态、i18n、Tailwind 和文件边界 |
| [30-components.md](docs/rules/30-components.md) | ProComponents、ProTable、表单和页面布局 |
| [40-api.md](docs/rules/40-api.md) | `R<T>`、分页、ID、URL、Springdoc 和前端 API 类型 |
| [50-delivery.md](docs/rules/50-delivery.md) | Git、提交、变更说明和本地验证 |

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

- 先读目标文件和同目录实现，复用已有工具、类型、常量和组件。
- 保持最小改动，不生成未使用的代码、依赖或注释。
- 后端接口必须遵守 `40-api.md` 的响应、校验和 Springdoc 规则。
- 前端列表、写操作、i18n 和页面布局必须遵守 `20-frontend.md` 与 `30-components.md`。
- 前端包管理器只能使用 `pnpm`。
- 改动完成后不得自动提交或推送；先展示摘要和验证结果，等待明确确认。

## 扩展规则

新增分类规则时使用数字前缀、写明 `applies_to` 路径范围，并同步更新本文件导航。特定模块的规则只有在跨文件复用且无法归入现有分类时才单独拆分。
