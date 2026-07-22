# Nova Admin Frontend

> Vite 8 + React 19 + TypeScript 7.0 + Ant Design 6.5 + Tailwind CSS 4

## 快速开始

```bash
# 推荐使用 pnpm
pnpm install
pnpm dev
```
访问 http://localhost:5173

## 脚本
- `pnpm dev` - 启动开发服务器（代理 /api -> http://localhost:8080）
- `pnpm build` - 生产构建
- `pnpm lint` - ESLint 检查
- `pnpm type-check` - TypeScript 类型检查

## 目录结构
```
src/
├── api/            # 接口请求函数
├── i18n/           # 国际化
├── layouts/        # 布局
├── pages/          # 页面
├── router/         # 路由 + 守卫
├── stores/         # Zustand
├── styles/         # 全局样式（Tailwind 4）
├── types/          # 类型定义
└── utils/          # 工具
```

## 默认登录
- 用户名：`admin`
- 密码：`admin123`
- Phase 0 演示模式下，未联通后端也可进入首页（占位 token）
