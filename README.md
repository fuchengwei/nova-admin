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

## ID 数据约定

系统使用雪花 ID。所有接口 JSON 响应中的 ID（包括关联 ID 和 ID 数组）均以字符串传输，
前端不得将其建模为 `number`；分页数量、文件大小、耗时等普通数值仍保持数字类型。

## 首页仪表盘

登录后访问首页可查看真实系统概览：用户、角色、部门、文件和定时任务规模；最近 7 天或 30 天的登录/操作趋势；运行资源、在线用户及最近动态。

接口为 `GET /api/dashboard/overview?range=7d|30d`。该接口仅要求已登录，不受既有用户、日志和监控页面的资源级权限限制；原有页面权限不变。

## 会话安全

登录会创建独立的服务端会话，JWT 必须对应有效会话才能访问受保护接口。用户被禁用、密码被修改、角色或菜单权限变更后，受影响用户会收到服务端 SSE 撤销事件、立即清除本地凭据并看到重新登录提示。服务监控的在线用户页支持持有 `monitor:online:remove` 权限的管理员踢出单个会话。

个人中心还提供当前账号的登录设备管理：`GET /api/auth/sessions` 查看会话，
`DELETE /api/auth/sessions/{accessJti}` 退出指定设备，`POST /api/auth/sessions/revoke-others`
退出其他设备。认证失败和权限不足分别使用 HTTP `401`、`403`，响应体仍保持统一 `R<T>` 格式。
系统设置中的验证码、登录失败锁定和 Token 有效期会在保存后用于后续认证请求；
`GET /api/auth/captcha` 会通过 `enabled` 字段告知登录页是否需要验证码。

## 密码生命周期

管理员在系统设置的安全策略中可设置密码有效期，`0` 表示永不过期。新建用户、批量导入用户与管理员重置密码后，用户首次登录会被要求立即修改密码；在完成前，服务端仅允许访问自身信息、修改密码、刷新令牌和退出登录，其余受保护接口返回 HTTP `403` 与业务码 `1008`。服务启动时会自动为已有 `sys_user` 和 `sys_config` 数据补齐密码生命周期字段与默认配置，既有用户默认不会被强制改密。

## 审计日志

操作日志会对密码、验证码和 Token 等敏感字段逐项脱敏；日志管理页支持查看完整审计详情，并只能按指定保留天数清理过期的操作日志或登录日志。

## 文件存储

文件支持本地磁盘和 MinIO 对象存储。管理员可在系统设置的上传策略中选择存储类型，并在保存前直接检测当前本地目录或 MinIO 存储桶的可用性；MinIO 的端点、桶和凭据仍由部署配置提供。系统会按配置自动创建存储桶，并通过既有 `/api/file/preview/**` 地址统一提供预览；切换默认存储不会影响既有文件的读取和删除。

## 系统公告

系统设置中的公告启用后，已登录用户进入系统会看到当前公告。公告编辑支持受限富文本（标题、加粗、列表、引用、链接等），保存与展示都会按白名单净化 HTML。公告按浏览器会话关闭；公告标题或内容变更后会再次提示。公告接口为 `GET /api/system/config/notice`，仅返回展示所需字段，不暴露邮件或短信通道配置。

## 用户导入导出

用户管理页支持下载 Excel 导入模板、批量导入和导出。导出遵循当前列表筛选条件且不包含密码。单次导入最多 1,000 行且文件不超过 10 MB；每行独立校验，失败行会在页面中反馈，成功行仍会写入系统。

模板使用中文字段，并直接标注必填项：账号、昵称为必填；姓名、邮箱、手机号、性别、部门、状态和角色为可选。性别、状态、部门和单个角色可通过下拉选择；多个角色用英文逗号分隔。部门和角色仅提供启用项。导入不再接受逐行密码，全部使用系统设置中的“用户导入初始密码”。

相关接口：`GET /api/system/user/export`、`GET /api/system/user/import-template`、`POST /api/system/user/import`。

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
