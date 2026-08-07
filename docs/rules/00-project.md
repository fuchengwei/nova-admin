# 项目级规则

> applies_to: `**/*`
> 这是所有后端、前端、SQL、文档和部署变更都必须遵守的基础规则。

## 1. 变更原则

- 先阅读目标文件及同目录实现，复用已有类型、常量、工具和组件。
- 保持最小改动：只修改实现当前需求所需的文件，不顺手重构无关代码。
- 不生成未使用的代码、配置、依赖和注释。
- 复杂逻辑只解释设计原因，不写重复代码行为的注释。
- 不确定的外部行为、数据格式或兼容性时，先查现有实现和配置；仍无法确定时再询问。

## 2. 仓库边界

| 路径 | 职责 |
|---|---|
| `nova-admin-backend/` | Spring Boot 后端、数据库初始化 SQL |
| `nova-admin-frontend/` | Vite + React 前端 |
| `docs/` | 规则、设计记录 |
| `docker-compose.yml` | 本地 PostgreSQL、Redis、MinIO |
| `docker-compose.prod.yml` | 生产容器编排 |
| `AGENTS.md` | AI 编程入口和规则索引 |

新模块必须放在对应端的现有模块边界内。不要把业务代码放入 `common`、`utils` 或根包来逃避模块归属。

## 3. 技术栈与依赖

- 后端固定使用 Java 25、Spring Boot 4.1、Spring Security、MyBatis-Plus、PostgreSQL、Redis、Redisson 和 MinIO。
- 前端固定使用 React 19、TypeScript 7、Vite 8、Ant Design 6、ProComponents 3、Tailwind CSS 4、Zustand 5 和 TanStack Query 5。
- 前端包管理器只能使用 `pnpm`，禁止 `npm` 和 `yarn`。
- 新增第三方依赖前必须说明现有库无法覆盖的原因，并取得确认。
- 不重复引入已有库覆盖的能力，例如表格、请求、状态管理和图标。

## 4. 用户可见内容

- 前端界面文案必须使用 `t()`，同时维护 `src/i18n/zh.ts` 和 `src/i18n/en.ts`。
- 后端返回的用户可见错误使用 `MessageSource`，不得在业务代码中散落硬编码文案。
- 文案、权限编码、菜单名称和配置键命名应与现有模块保持一致。

## 5. 接口和文档同步

- 新增或修改公开后端接口时，同步更新 API 注解、前端 API 类型和根 README 的功能/API 说明。
- 新增模块或改变启动、部署方式时，同步更新 README 和 `docs/deployment.md`。
- 规则只维护在 `docs/rules/` 对应分类文件中；不要在 `AGENTS.md` 复制详细规则。

## 6. 交付边界

- 代码完成后不得自动执行 `git commit`，先展示变更摘要和验证结果，等待明确确认。
- 不使用破坏性命令处理不在当前需求范围内的文件或数据。
- 需要重置数据库、Redis、MinIO 或其他持久化数据时，先明确目标环境和数据范围。
