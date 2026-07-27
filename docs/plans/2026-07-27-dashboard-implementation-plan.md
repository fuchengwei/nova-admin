# 首页仪表盘实施计划

> 设计依据：[首页仪表盘设计](../superpowers/specs/2026-07-27-dashboard-design.md)

## 1. 配置前端依赖与测试环境

修改 `nova-admin-frontend/package.json` 与 `pnpm-lock.yaml`：

1. 添加已获批准的生产依赖 `@ant-design/charts`。
2. 添加 Vitest、React Testing Library、`@testing-library/user-event`、`@testing-library/jest-dom`、jsdom 及 Vitest 的 React 配置所需开发依赖。
3. 在 `vite.config.ts` 添加 Vitest 的测试环境、路径别名和 setup 文件配置；新增测试脚本。
4. 新增 `src/test/setup.ts`，加载 jest-dom 匹配器并在每个测试后清理渲染结果。

验证：执行 `pnpm install`，再执行 `pnpm type-check` 和空测试套件的 `pnpm test`，确认配置、DOM 环境和别名可用。

## 2. 建立后端仪表盘数据模型与枚举

新增 `nova-admin-backend/src/main/java/com/nova/admin/modules/dashboard/` 下的 DTO、枚举与 Service 接口：

1. 使用枚举建模 `7d` 与 `30d` 范围，Controller 参数通过 Bean Validation 或显式转换进行校验，并将默认值固定为 `7d`。
2. 建模 `DashboardOverviewDTO` 及明确的嵌套 DTO：区块包装（`available` 与数据）、统计项、趋势点、分布项、运行摘要和活动项。
3. 活动类型与活动状态使用枚举或稳定字符串常量，保证前端可进行本地化渲染而不依赖中文文本。
4. 所有数值使用精确、适合公开 API 的 Java 类型；百分比由服务层归一化并限制在 `0..100`。

验证：新增 DTO 单元测试或序列化断言，确认稳定 JSON 字段、默认时间范围和非法范围处理。

## 3. 新增无资源级权限的聚合查询与服务

新增 `DashboardMapper` 及必要的 SQL 映射，查询时显式过滤逻辑删除记录，但不使用 `@DataScope`：

1. 对 `sys_user`、`sys_role`、`sys_dept`、`sys_menu`、`sys_file`、`sys_job` 聚合总数；查询保持只读且走简单 `COUNT`。
2. 对登录日志和操作日志按仪表盘时间范围聚合每日数量；Service 根据业务时区补足连续日期。
3. 分别读取有限数量的最新登录/操作日志，在 Service 中统一转换、按发生时间降序合并并截取前 5 条。
4. Service 调用现有 `MonitorService` 获取服务器摘要及在线用户数；在依赖异常时只将 `runtime.available` 设为 `false`，保持其他区块返回。
5. 对统计、趋势、动态各自隔离异常，将对应区块置为不可用并返回空值，避免整个首页请求失败。

新增 `DashboardServiceImplTest`，使用 Mockito 覆盖 `7d`/`30d` 的补零逻辑、聚合结果、活动排序截取、空数据和监控异常降级。

验证：在 `nova-admin-backend` 执行 `mvn test -Dtest=DashboardServiceImplTest`。

## 4. 暴露认证即可访问的概览 API

新增 `DashboardController`：

1. 映射 `GET /dashboard/overview`，返回 `R<DashboardOverviewDTO>`。
2. 添加 `@Tag`、`@Operation`，以及参数的 `@Parameter` / `@Schema` 元数据。
3. 不添加资源级 `@PreAuthorize`；依赖 `SecurityConfig` 的 `anyRequest().authenticated()`，使所有已登录用户可访问。
4. 添加 Web 层测试，验证未认证请求被全局安全链拒绝、已认证请求不需要用户/日志/监控等模块权限。

验证：运行相关 Controller 测试，并在 Swagger UI 核对端点、参数和响应模型。

## 5. 定义前端 API、国际化与页面状态

新增 `nova-admin-frontend/src/api/dashboard.ts`，精确声明与后端响应对应的 TypeScript 类型以及 `getDashboardOverview(range)` 请求函数。

同步修改 `src/i18n/zh.ts` 与 `src/i18n/en.ts`，添加仪表盘标题、统计名称、图表标题、时间范围、活动类型、状态、空态、失败反馈和重试文案。保持两个语言文件的键及顺序一致。

重写 `src/pages/dashboard/index.tsx`：

1. 用本地 `useState` 保存当前范围，默认 `7d`。
2. 用单个 `useQuery` 和键 `['dashboard', 'overview', range]` 拉取概览，设置 30 秒 `refetchInterval`。
3. 用固定高度骨架处理初始加载；使用局部错误状态和重试按钮处理整体失败。
4. 仅负责页面区域布局和数据分发，不在此文件放图表配置或展示转换逻辑。

验证：前端测试中 mock API 响应，确认范围变化更新查询键且不会清空已有统计区块。

## 6. 实现图表与展示组件

在 `nova-admin-frontend/src/pages/dashboard/components/` 创建单职责组件：

1. `DashboardHeader.tsx`：日期、运行状态和更新时间。
2. `DashboardStatCards.tsx`：六张业务规模卡片，确保数值加载与空态不改变卡片尺寸。
3. `ActivityTrendChart.tsx`：使用 `@ant-design/charts` 的 `Line`，接收已转换的连续日期数据，提供 7 天/30 天分段切换、图例和本地化 Tooltip。
4. `AssetDistributionChart.tsx`：使用 `Bar` 展示六项资产规模；空数据保留固定高度。
5. `RuntimeOverview.tsx`：使用 Ant Design `Progress` 的进度环展示 CPU、内存、JVM，附在线用户与服务状态；不可用时显示一致的不可用状态，不显示伪造的零值。
6. `RecentActivities.tsx`：显示五条最新动态的类型、执行人、摘要、结果和时间。

页面使用响应式 CSS Grid：桌面端趋势/分布并列、运行/活动并列或按可读性分行；移动端所有区块单列。保持卡片圆角不超过项目已有风格，并避免卡片嵌套、操作按钮或装饰性背景。

验证：对各展示组件编写 RTL 测试，覆盖加载、空数据、不可用、失败、正常数据，以及范围切换。图表库在单元测试中 mock 为可验证的轻量组件，重点断言传入数据与可访问文本。

## 7. 完成文档与全量验证

1. 更新 `README.md`，记录仪表盘能力、认证可见性和开发启动方式。
2. 更新 `CHANGELOG.md`，记录新增 Dashboard API 与数据可视化功能。
3. 格式化和验证前端：`pnpm format`、`pnpm lint`、`pnpm type-check`、`pnpm test`、`pnpm build`。
4. 验证后端：`mvn test`；若环境具备数据库/Redis，则启动服务并以普通已登录账号验证无模块权限时仍可返回完整首页概览。
5. 核对 OpenAPI、中文/英文切换、7 天/30 天趋势、窄屏布局和各区块降级状态。

## 实施顺序与提交边界

先完成后端模型、查询、服务和 API 测试，再完成前端依赖、API、i18n、组件和测试，最后更新文档与运行全量验证。实现期间不创建提交；完成后仅展示变更摘要和验证结果，等待明确提交指令。
