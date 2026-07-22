# Nova Admin 部署文档

> 适用版本：v1.0.0（Phase 0–13 全量功能）
> 更新日期：2026-07-22

本文档覆盖两种部署方式：

1. [本地开发](#一本地开发) —— 仅起基础设施，前后端本地运行
2. [生产部署（Docker）](#二生产部署docker) —— 容器化构建并编排后端 / 前端 / 中间件

---

## 一、本地开发

### 1.1 启动基础设施

```bash
# macOS 推荐 OrbStack；也可使用 Docker Desktop
orb start            # 或 open -a Docker
docker compose up -d # 启动 PG / Redis / MinIO
```

### 1.2 启动后端

```bash
cd nova-admin-backend
mvn spring-boot:run        # 默认 dev profile，端口 8080，context-path /api
```

- OpenAPI 文档：`http://localhost:8080/api/swagger-ui.html`
- 默认管理员账号：`admin / admin123`

### 1.3 启动前端

```bash
cd nova-admin-frontend
pnpm install               # 需要 Node >= 20.19
pnpm dev                   # 端口 5173，/api 代理到 localhost:8080
```

访问 `http://localhost:5173`。

---

## 二、生产部署（Docker）

### 2.1 前置要求

- Docker 24+ 与 Docker Compose v2
- 为以下敏感项准备环境变量（建议写入 `.env` 文件，勿提交到仓库）：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `NOVA_DB_PASSWORD` | PostgreSQL 密码 | `nova_pass_2026` |
| `NOVA_REDIS_PASSWORD` | Redis 密码 | `nova_redis_2026` |
| `NOVA_JWT_SECRET` | JWT 签名密钥（**必填，无默认值**） | — |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | MinIO 凭据 | `nova_minio` / `nova_minio_2026` |

> 生成 JWT Secret 示例：`openssl rand -base64 48`

### 2.2 构建并启动

```bash
# 在项目根目录
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

启动后：

- 前端（Nginx）暴露在 `http://<host>:80`
- 后端 API 经 Nginx 反代：`http://<host>/api/...`
- Swagger：`http://<host>/api/swagger-ui.html`

### 2.3 镜像说明

| 镜像 | 构建上下文 | 技术栈 |
| --- | --- | --- |
| `nova-admin-backend:1.0.0` | `nova-admin-backend` | Maven 3.9 + Eclipse Temurin JDK 25（多阶段，运行期仅 JRE） |
| `nova-admin-frontend:1.0.0` | `nova-admin-frontend` | Node 22 构建 + Nginx 1.27 托管 |

前端 `nginx.conf` 已配置：

- SPA 历史路由回退（`try_files ... /index.html`）
- `/api/` 反向代理至 `backend:8080/api/`
- 上传体上限 `100m`（与后端 `max-file-size` 对齐）

### 2.4 常用运维命令

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml pull   # 更新基础镜像
```

### 2.5 反向代理（可选，置于 80 端口前）

若需 TLS，可在前端容器前再加一层 Nginx / Caddy 终结 HTTPS，将请求转发到
`http://<host>:80`。注意保留 `/api` 路径透传。

---

## 三、健康检查

- 后端 Actuator：`GET /api/actuator/health`（需授权才显示详情）
- 暴露端点：`health, info, metrics`（见 `application.yml`）

---

## 四、数据初始化

`nova-admin-backend/sql/init.sql` 会在 PostgreSQL 首次启动时自动执行（挂载到
`docker-entrypoint-initdb.d`）。其中包含：

- 系统表结构（`sys_*` / `gen_*`）
- 菜单与权限种子数据
- 默认管理员 `admin`

> 重新初始化数据库请删除对应 volume（`pg-data`）后重启 Postgres。
