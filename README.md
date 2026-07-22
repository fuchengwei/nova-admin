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
- Ant Design 6.5 + Tailwind CSS 4
- Zustand 5 + TanStack Query 5

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
```bash
docker compose up -d
```
启动 PostgreSQL 17、Redis 8、MinIO。

### 2. 启动后端
```bash
cd nova-admin-backend
./mvnw spring-boot:run
```
默认端口 `8080`，OpenAPI 文档：`http://localhost:8080/swagger-ui.html`

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

## 文档

- 设计文档：[`docs/plans/2026-07-22-nova-admin-design.md`](docs/plans/2026-07-22-nova-admin-design.md)

## 许可证

MIT
