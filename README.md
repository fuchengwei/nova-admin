# Nova Admin

> 通用 RBAC 后台权限管理系统（Monorepo）

## 技术栈

### 后端 (`nova-admin-backend`)
- Spring Boot 4.1.0 + Java 25
- Spring Security 7.1.0 + JJWT 0.12.6
- MyBatis-Plus 3.5.15
- PostgreSQL 17 + Redis 8
- Redisson 3.40+

### 前端 (`nova-admin-frontend`)
- Vite 8 + React 19 + TypeScript 7.0
- Ant Design 6.5 + **ProComponents 3.x**（`@ant-design/pro-components`）+ Tailwind CSS 4
- Zustand 5 + TanStack Query 5
- `@ant-design/charts` 2.6（首页活动趋势图）

## 首页仪表盘

登录后访问首页可查看真实系统概览：用户、角色、部门、文件和定时任务规模；最近 7 天或 30 天的登录/操作趋势；运行资源、在线用户及最近动态。

接口为 `GET /api/dashboard/overview?range=7d|30d`。该接口仅要求已登录，不受既有用户、日志和监控页面的资源级权限限制；原有页面权限不变。

## 项目结构

```
nova-admin/
├── docs/                          # 设计/部署/API 文档
├── nova-admin-backend/            # Spring Boot 后端
├── nova-admin-frontend/           # React 前端
├── docker-compose.yml             # 本地基础设施 (PG/Redis/MinIO)
└── README.md
```

## 快速开始

### 1. 启动基础设施
> **macOS 推荐使用 OrbStack**（轻量 Docker Desktop 替代品）：

```bash
# 1) 启动 OrbStack（首次或关闭后）
orb start

# 2) 启动 PG / Redis / MinIO
docker compose up -d
```

> 也可以使用 Docker Desktop：`open -a Docker` → 等待就绪后执行 `docker compose up -d`。

### 2. 启动后端
```bash
cd nova-admin-backend
mvn spring-boot:run
```
默认端口 `8080`，OpenAPI 文档：`http://localhost:8080/api/swagger-ui.html`

### 3. 启动前端
```bash
cd nova-admin-frontend
pnpm install
pnpm dev
```
默认端口 `5173`，访问 `http://localhost:5173`

## 默认账号

| 用户名 | 密码 | 说明 |
| --- | --- | --- |
| `admin` | `admin123` | 超级管理员 |

## 部署

容器化构建与编排见 [部署文档](docs/deployment.md)：

```bash
# 生产镜像构建并启动（后端 + 前端 + PG/Redis/MinIO）
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

- 前端（Nginx）暴露 `80`，并把 `/api` 反代到后端
- 后端镜像：多阶段 `Dockerfile`（Maven 3.9 + Eclipse Temurin JDK 25）
- 前端镜像：多阶段 `Dockerfile`（Node 22 构建 + Nginx 1.27 托管）

## 文档

- 设计文档：[`docs/plans/2026-07-22-nova-admin-design.md`](docs/plans/2026-07-22-nova-admin-design.md)
- 前端开发规范（优先使用 ProComponents）：[`docs/development-guidelines.md`](docs/development-guidelines.md)
- 部署文档：[`docs/deployment.md`](docs/deployment.md)
- 更新日志：[`CHANGELOG.md`](CHANGELOG.md)

## 许可证

MIT
