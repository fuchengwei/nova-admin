# Nova Admin — 前端 ProLayout 布局组件设计文档

> 版本：v1.0
> 日期：2026-07-23
> 类型：前端布局组件 / ProLayout 重构
> 关联分支：`master`

---

## 一、背景与目标

现有 `src/layouts/AdminLayout.tsx` 基于手写 antd `Layout/Sider/Menu/Header` 实现，已具备菜单加载、图标映射、语言切换、用户菜单、折叠等能力。本次将其升级为以 ProComponents 的 `ProLayout` 为核心框架，统一接管顶部导航栏、侧边菜单栏与主内容区域，并明确菜单数据传入、路由跳转与同步、标题与 Logo 渲染、响应式与权限兼容规则。

### 关键决策摘要

| 决策点 | 选型 |
| --- | --- |
| 落地方式 | 重写 `AdminLayout.tsx`，复用 `userStore`/`appStore` 与现有路由接入 |
| 菜单数据 | 后端 `userStore.menus` + Dashboard 根节点 + 静态兜底（后端为空时） |
| 折叠状态 | 受控 `sidebarCollapsed`（持久化）+ `breakpoint="lg"` 响应式自动收起 |
| 标题/Logo | 文本 Logo「Nova Admin」+ 同步 `document.title` + `navTheme` 接 `appStore.theme` |
| 权限过滤 | `visible===0` 隐藏 + `perms` 缺失则隐藏（超级管理员 `*:*:*` 豁免） |

---

## 二、架构与文件

- **文件**：`src/layouts/AdminLayout.tsx`（重写，单文件单组件，估算 ~180 行）。
- **移除**：手写 `Layout/Sider/Header/Menu`，改由 `ProLayout` 统一接管顶栏、侧栏、内容区。
- **内容区**：`ProLayout` 的 `children` 渲染 `<Outlet />`（保持与现有 `router/index.tsx` 接入一致）。
- **依赖**：`ProLayout`、`useNavigate`/`useLocation`（react-router-dom v7）、`useUserStore`/`useAppStore`、`react-i18next` 的 `t()`。

---

## 三、菜单数据（route 树）

1. 复用 `userStore.menus`（后端 `MenuInfo[]`），在根节点前插入 Dashboard（`/`）。
2. 转换函数 `buildRoute(menus)`：递归映射为 ProLayout `route` 结构
   `{ path, name, icon, routes }`：
   - 过滤 `visible === 0` 的隐藏菜单；
   - 若菜单带 `perms` 且用户权限不含该 `perms`（超级管理员 `*:*:*` 豁免），则隐藏，实现菜单级权限控制。
3. 后端菜单为空时回退到现有静态兜底菜单（系统/基础设施/监控分组）。
4. 图标：保留现有 `iconMap`（名称 → antd 图标组件映射），属真实逻辑，非透传封装。

---

## 四、路由跳转与同步

- `menuItemRender={(item, dom) => <a onClick={() => navigate(item.path!)}>{dom}</a>}` 完成菜单点击跳转。
- 选中态：用 `location.pathname` 同步 `ProLayout` 的 `location={{ pathname }}`。
- 面包屑：ProLayout 基于 `route` 树自动生成。

---

## 五、Logo / 标题渲染

- **Logo**：`sidebarCollapsed` 控制折叠显示「N」、展开显示「Nova Admin」文本节点；`title` 传项目名。
- **document.title**：`useEffect` 监听 `location.pathname`，沿 `route` 树查找当前节点 `name`，经 i18n 翻译后写入 `document.title`。
- **主题**：`navTheme = appStore.theme === 'dark' ? 'realDark' : 'light'`。

---

## 六、头部操作区

- 语言切换（Dropdown，复用现有 `langMenu`）与用户头像下拉（profile/logout，复用现有 `userMenu`），通过 `actionsRender` / `avatarProps` 渲染。

---

## 七、响应式与折叠

- `collapsed={sidebarCollapsed}`，`onCollapse={toggleSidebar}`（受控 + 持久化）。
- `breakpoint="lg"`：屏幕宽度 < 1024px 时 ProLayout 自动收起侧栏；手动切换仍持久化。
- `siderWidth={220}`。

---

## 八、兼容性

- 不改动 `router/index.tsx`、`AuthGuard.tsx`、`userStore`、`appStore`。
- 保留菜单加载逻辑（`getUserInfo`/`getUserMenus`）与 loading 态。
- 权限过滤在 `route` 构建阶段完成，与后端接口拦截互补。

---

## 九、测试

- 新增 Vitest + React Testing Library 用例：
  - 验证 `buildRoute` 对 `visible===0` 与 `perms` 的过滤；
  - 验证 `document.title` 随路由同步；
  - 验证折叠状态受控与 `onCollapse` 回调。
