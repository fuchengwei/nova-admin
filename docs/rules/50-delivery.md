# 交付与协作规则

> applies_to: `**/*`

## 1. 分支和提交

- `master` 只接收合并结果；功能分支使用 `feat/<scope>-<brief>`，修复使用 `fix/<scope>-<brief>`，重构使用 `refactor/<scope>-<brief>`，文档使用 `docs/<brief>`。
- 提交遵循 Conventional Commits：`<type>(<scope>): <subject>`。
- 可用 type：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`build`、`ci`、`chore`、`revert`。
- subject 使用中文祈使句，长度不超过 50 字，不加句号。
- scope 优先使用 `frontend`、`backend`、`auth`、`user`、`role`、`menu`、`dept`、`dict`、`job`、`infra`、`monitor`、`docker` 等已有范围。

## 2. 变更说明

- 新增模块、公开接口、配置键或部署方式时，同步更新根 README 和相关文档。
- 设计、部署和运行说明放在 `docs/`；规则只放在 `docs/rules/`。
- PR 描述至少说明 What、Why 和 Verification；涉及 UI 时附截图或说明验证路径。
- 不在提交中混入与当前需求无关的格式化、依赖升级或文件移动。

## 3. 本地验证

后端：

```bash
cd nova-admin-backend
mvn package
```

前端：

```bash
cd nova-admin-frontend
pnpm type-check
pnpm build
```

通用：

```bash
git diff --check
```

`pnpm lint` 仍保留为项目脚本；当前仓库使用 ESLint 9 与旧式 `.eslintrc.cjs`，若执行失败，先完成 ESLint flat config 迁移再将其纳入强制检查。

## 4. Git 操作边界

- 完成代码或文档变更后不自动提交、不自动推送。
- 删除文件、重置数据库或清理对象存储前确认精确目标；优先使用可恢复方案。
- 发现工作区已有用户改动时保留它们，不使用 `reset --hard` 或 `checkout --` 覆盖。
