# 个人中心与系统设置页拆分重构设计文档

> 日期：2026-07-27  
> 状态：已获对话内设计确认，待用户审阅书面规格  
> 范围：修复头像/Logo 空 `src` 警告，拆分个人中心与系统设置页超大前端文件  
> 项目：Nova Admin

## 1. 背景与目标

当前前端已完成个人中心页 `/profile` 与系统设置页 `/system/settings` 的功能和一轮 UI 打磨，但两个页面仍存在两个明确问题：

1. 页面文件过大，展示、状态、请求、弹窗表单都集中在单个 `index.tsx` 中，职责过于混杂。
2. 控制台出现 `An empty string ("") was passed to the src attribute` 警告，说明头像或 Logo 在无值时仍向 DOM 传入了空字符串 `src`。

本轮目标不是改功能，也不是重做视觉，而是在保持现有业务行为和页面风格不变的前提下完成一次聚焦重构：

- 修复头像与 Logo 的空 `src` 警告。
- 将两个超大页面按“页面组装 + hook + 页面私有组件”的方式拆分。
- 允许顺手做低风险的小幅清理，例如减少重复展示、收敛局部命名和提炼辅助逻辑。

## 2. 范围

### 2.1 包含

- `nova-admin-frontend/src/pages/profile/index.tsx` 拆分。
- `nova-admin-frontend/src/pages/system/settings/index.tsx` 拆分。
- 修复个人中心头像与系统设置 Logo 相关的空 `src` 警告。
- 将页面内的 query、mutation、弹窗开关、本地展示态收敛到页面私有 hook。
- 将页面内定义的展示区块、详情区块、弹窗表单拆到页面私有组件目录。
- 允许做少量展示层结构清理，但不改变业务能力。

### 2.2 不包含

- 路由结构调整。
- API 契约变更。
- 权限模型调整。
- i18n 语义调整或新增复杂文案体系。
- 系统设置页视觉重做。
- 通用组件库抽象或跨页面公共组件沉淀。
- 新增测试框架或大规模补测试。

## 3. 方案选择

本轮采用“页面内聚优先的深入拆分”方案。

核心原则：

1. **页面内聚优先**：拆分出的组件和 hook 先留在各自页面目录下，不提前抽象为全局公共组件。
2. **深入拆分而非只拆 JSX**：不仅把展示块拆出去，也把页面级数据逻辑、上传逻辑、弹窗状态和提交动作整理到页面私有 hook。
3. **行为保持稳定**：以无感重构为主，唯一明确功能修复是消除空 `src` 警告并确保 fallback 展示更稳。
4. **允许小幅清理**：仅处理与本次重构直接相关的重复结构、命名和格式化逻辑，不扩展功能边界。

选择原因：

- 仅拆展示组件无法真正解决大文件问题，数据逻辑仍会使 `index.tsx` 持续膨胀。
- 过早抽取跨页面公共组件容易把语义不同的结构硬合并，增加后续维护成本。
- 页面内聚拆分最符合当前目标：快速降低单文件复杂度，同时保留页面独立演进能力。

## 4. 目标文件与现状问题

### 4.1 个人中心页

目标文件：

- `nova-admin-frontend/src/pages/profile/index.tsx`

当前问题：

- 页面同时承担布局、用户信息刷新、头像上传、资料编辑、密码修改、时间格式化等职责。
- 左侧主卡、基础资料卡、安全信息卡、两个弹窗全部写在一个文件中。
- 头像 `src` 在接口返回空字符串时可能直接传入 `Avatar`，触发控制台警告。
- 页面存在局部信息重复展示，影响拆分后的边界清晰度。

### 4.2 系统设置页

目标文件：

- `nova-admin-frontend/src/pages/system/settings/index.tsx`

当前问题：

- 页面同时定义概览卡、详情区、四组 query、四组 mutation、Logo 上传、四个弹窗表单。
- 文件顶部内联声明多个局部组件，导致主页面逻辑和展示实现混杂。
- 基础设置中的 Logo 预览在无值时可能向 `Avatar` 传入空字符串 `src`。
- 详情区和弹窗表单都较长，继续在单文件迭代会让维护成本持续上升。

## 5. 拆分结构设计

### 5.1 个人中心页目录设计

建议结构：

```text
src/pages/profile/
  index.tsx
  hooks/
    useProfilePage.ts
  components/
    ProfileHeroCard.tsx
    ProfileBasicInfoCard.tsx
    ProfileSecurityCard.tsx
    ProfileEditModal.tsx
    ProfilePasswordModal.tsx
```

职责分配：

- `index.tsx`
  - 仅负责页面布局与组件组装。
  - 调用 `useProfilePage` 获取页面 view-model。
  - 将展示数据和事件传递给子组件。

- `hooks/useProfilePage.ts`
  - 管理头像本地 state。
  - 管理资料编辑与密码编辑弹窗开关。
  - 实现 `refreshCurrentUser`。
  - 管理资料更新、头像上传、密码修改三个 mutation。
  - 输出 `uploadProps`、表单初始值、格式化时间、提交函数等页面级行为。

- `ProfileHeroCard`
  - 负责左侧资料主卡展示。
  - 展示头像、昵称、账号、上传按钮和概览信息。
  - 只接受安全归一化后的 `avatarSrc`。

- `ProfileBasicInfoCard`
  - 负责基础资料只读展示和“编辑资料”入口。

- `ProfileSecurityCard`
  - 负责安全信息只读展示和“修改密码”入口。
  - 允许顺手消除与基础资料卡的过度重复展示。

- `ProfileEditModal`
  - 负责资料编辑表单。

- `ProfilePasswordModal`
  - 负责密码修改表单和确认密码校验。

### 5.2 系统设置页目录设计

建议结构：

```text
src/pages/system/settings/
  index.tsx
  hooks/
    useSystemSettingsPage.ts
  components/
    SettingsHero.tsx
    SettingsOverviewGrid.tsx
    SettingsDetailSections.tsx
    OverviewCard.tsx
    DetailSection.tsx
    MetaPanel.tsx
    MetaRow.tsx
    modals/
      BasicSettingsModal.tsx
      SecuritySettingsModal.tsx
      UploadSettingsModal.tsx
      NoticeSettingsModal.tsx
```

职责分配：

- `index.tsx`
  - 仅负责页面骨架组装。
  - 统一处理只读提示、loading skeleton、概览区、详情区与弹窗挂载顺序。

- `hooks/useSystemSettingsPage.ts`
  - 管理四组设置的 query。
  - 管理四组设置的 mutation。
  - 管理 Logo 上传 mutation。
  - 管理四个弹窗开关与 `logoUrl` 本地展示态。
  - 输出 `canEdit`、初始值、聚合 loading 状态、上传 props、提交动作等页面级数据。

- `SettingsHero`
  - 负责顶部说明区展示。

- `SettingsOverviewGrid`
  - 负责四张模块摘要卡的组合。
  - 不直接处理请求，只消费页面传入的数据和点击事件。

- `SettingsDetailSections`
  - 负责四个模块详情 section 的整体拼装。
  - 内部复用 `DetailSection`、`MetaPanel`、`MetaRow` 等 settings 私有展示组件。

- `OverviewCard` / `DetailSection` / `MetaPanel` / `MetaRow`
  - 作为 settings 页专用展示基元保留在本页面目录下。
  - 不提升到全局公共组件目录。

- 四个 modal 文件
  - 每个文件只维护各自分组的表单结构和提交回调。
  - `BasicSettingsModal` 额外负责 Logo 预览与上传入口。

## 6. 警告修复策略

### 6.1 问题定义

React 控制台警告表明页面在某些情况下向 DOM 传入了空字符串 `src=""`。这通常发生在头像或 Logo 值为空字符串时，Ant Design `Avatar` 仍收到 `src` 属性。

### 6.2 修复原则

统一规则如下：

- 有有效图片地址时才传 `src`。
- 为空字符串、仅空白字符串、`null`、`undefined` 时，一律不传图源。
- 无图时交给 `Avatar` 的 `icon` 或 fallback 展示。

建议采用页面级轻量归一化：

- `avatar?.trim() ? avatar : undefined`
- `logoUrl?.trim() ? logoUrl : undefined`

这样可以避免 JSX 中散落大量三元表达式，也能防止接口回传 `''` 或 `'   '` 时再次触发警告。

### 6.3 本轮覆盖点

重点覆盖以下展示位：

- 个人中心主卡头像。
- 系统设置基础设置详情中的 Logo 预览。
- 系统设置基础设置弹窗中的 Logo 预览。

如果在拆分过程中发现同页还有其他图片展示位使用了相同模式，也按相同规则一并修复。

## 7. 页面数据流与职责边界

### 7.1 个人中心页数据流

页面行为保持现状：

1. 页面初次渲染先展示 `userStore.userInfo` 中已有信息。
2. `useProfilePage` 在挂载后调用 `refreshCurrentUser()` 同步最新用户资料。
3. 资料保存成功后关闭弹窗并重新拉取当前用户信息。
4. 头像上传成功后更新本地头像展示并重新拉取当前用户信息，确保 Header 同步。
5. 密码修改成功后清理 token、重置用户 store，并跳转 `/login`。

`useProfilePage` 对外建议输出：

- `userInfo`
- `roleTags`
- `avatarSrc`
- `loginTimeText`
- `profileModalOpen`
- `passwordModalOpen`
- `setProfileModalOpen`
- `setPasswordModalOpen`
- `profileInitialValues`
- `uploadProps`
- `avatarUploading`
- `profileSaving`
- `passwordSaving`
- `handleProfileSubmit`
- `handlePasswordSubmit`

### 7.2 系统设置页数据流

页面行为保持现状：

1. 页面进入后并行拉取基础设置、安全策略、上传策略、通知公告四组数据。
2. 页面根据 `roles` 和 `permissions` 计算 `canEdit`。
3. 保存某一组设置时，仅提交该组 DTO。
4. 保存成功后关闭对应弹窗并刷新当前组数据。
5. Logo 上传成功后更新本地 `logoUrl`，并在保存基础设置后以服务端最新数据为准。

`useSystemSettingsPage` 对外建议输出：

- `canEdit`
- `basicData` / `securityData` / `uploadData` / `noticeData`
- 聚合 loading 状态
- 四个 modal 的开关与 setter
- `logoUrl`
- `logoUploadProps`
- 四组 `initialValues`
- 四组提交函数
- 只读提示显示条件

### 7.3 边界原则

本轮拆分坚持以下边界：

1. **hook 管状态和副作用，组件管展示**。
2. **页面只做组装，不再内联实现大段展示组件和表单结构**。
3. **组件优先保持无副作用**，网络请求、路由跳转、store 更新全部留在 hook。
4. **私有组件不做跨页面抽象**，避免为了复用而过度泛化。

## 8. 小幅清理策略

本轮允许进行的清理仅限与拆分直接相关的低风险整理：

### 8.1 个人中心页

- 减少基础资料卡和安全信息卡中的重复展示。
- 将登录时间格式化逻辑移出页面主体，统一由 hook 输出。
- 收敛弹窗开关和表单提交逻辑，降低 `index.tsx` 噪声。

### 8.2 系统设置页

- 将顶部 Hero、概览卡矩阵、详情 section、四个 modal 分离到独立文件。
- 将页面顶部内联展示组件移到页面私有组件文件。
- 对摘要项构造、Badge/Tag 展示等局部重复逻辑做轻量收敛。

### 8.3 明确不做的清理

- 不重命名 API 方法。
- 不调整权限判断语义。
- 不重构为全局共享设计系统组件。
- 不改变现有模块顺序、编辑入口形式和弹窗交互模式。

## 9. 风险控制

为避免“拆分后表面更整洁，但行为悄悄变更”，本轮实施中需控制以下风险：

1. **不改路由**：`/profile` 与 `/system/settings` 的访问方式保持不变。
2. **不改接口契约**：仍复用现有 API 返回结构和 DTO 类型。
3. **不改权限规则**：系统设置编辑权限继续基于 `super_admin` 或 `system:settings:edit`。
4. **不改成功后主流程**：头像上传、资料保存、密码修改、配置保存后的用户路径保持一致。
5. **不改现有 i18n key 语义**：页面文案继续复用当前 key，避免牵连额外翻译变更。

唯一明确功能修复为：

- 消除空字符串 `src` 控制台警告。
- 让无图场景稳定走 `Avatar` fallback，不再依赖浏览器对空地址的容错行为。

## 10. 测试与验收标准

### 10.1 验证重点

本轮以“行为不变 + 警告消失”为主要验证目标。

#### 空 `src` 警告验证

需验证以下场景不再出现：

> `An empty string ("") was passed to the src attribute...`

覆盖场景：

- 用户头像为空。
- 系统 Logo 为空。
- 上传成功后返回新图片地址。
- 页面刷新后接口返回空字符串、空白字符串或空值。

目标：

- 控制台不再出现 `src=""` 相关警告。
- 无图时正确展示 `Avatar` 的 `icon` 或默认占位。

#### 个人中心页验证

- 进入页面时能正常展示当前用户信息。
- 页面挂载后仍会刷新当前用户信息。
- 上传头像成功后页面头像正常更新。
- 编辑资料成功后资料展示刷新正常。
- 修改密码成功后仍会退出登录并跳转 `/login`。
- 角色、部门、登录时间等信息展示正常。
- 小幅去重后没有丢失关键只读信息。

#### 系统设置页验证

- 四组设置仍能正常加载。
- loading skeleton 行为保持一致。
- 无编辑权限时仍然只读。
- 每个模块编辑按钮仍打开对应弹窗。
- 各弹窗保存成功后仍刷新对应配置。
- Logo 上传成功后预览更新正常。
- 长表单弹窗交互不退化。

### 10.2 完成标准

实现完成后应满足：

1. `profile/index.tsx` 不再承载大量状态、请求和弹窗细节。
2. `system/settings/index.tsx` 不再承载大量内联展示组件和四组表单实现。
3. 两个页面内所有头像与 Logo 展示都不会向 DOM 传 `src=""`。
4. 页面现有业务行为保持一致，不引入新的交互变化。
5. 允许的小幅清理仅限去重、命名和结构整理，不额外扩展功能。

## 11. 涉及文件

预期主要涉及：

- `nova-admin-frontend/src/pages/profile/index.tsx`
- `nova-admin-frontend/src/pages/profile/hooks/useProfilePage.ts`
- `nova-admin-frontend/src/pages/profile/components/*`
- `nova-admin-frontend/src/pages/system/settings/index.tsx`
- `nova-admin-frontend/src/pages/system/settings/hooks/useSystemSettingsPage.ts`
- `nova-admin-frontend/src/pages/system/settings/components/*`

可能复用但不改契约的相关文件：

- `nova-admin-frontend/src/api/profile.ts`
- `nova-admin-frontend/src/api/settings.ts`
- `nova-admin-frontend/src/stores/userStore.ts`
- `nova-admin-frontend/src/utils/request.ts`

## 12. 实施注意事项

- 前端包管理继续使用 pnpm。
- 不新增与现有技术栈重叠的第三方依赖。
- 保持当前页面风格与交互，不做视觉重构。
- 代码改动完成后不自动提交，等待用户确认。
- 该文档本次只负责明确重构边界与验收标准，后续实现计划需在用户审阅书面规格后再展开。
