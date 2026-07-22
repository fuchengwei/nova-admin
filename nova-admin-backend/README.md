# Nova Admin Backend

> Spring Boot 4.1.0 + Java 25 + MyBatis-Plus 3.5.15 + Spring Security 7.1.0 + JJWT 0.12.6

## 快速开始

### 1. 启动基础设施
```bash
cd ..
docker compose up -d
```

### 2. 启动后端（dev profile）
```bash
./mvnw spring-boot:run
```
访问：
- API: http://localhost:8080/api
- OpenAPI 文档: http://localhost:8080/api/swagger-ui.html

### 3. 打包
```bash
./mvnw clean package -DskipTests
java -jar target/nova-admin-backend.jar
```

## 目录结构
```
src/main/java/com/nova/admin
├── AdminApplication.java
├── admin/             # 启动 + 配置
│   └── config/
├── common/            # 通用基础
│   ├── api/           # R / PageResult / ResultCode / PageQuery
│   ├── base/          # BaseDO / BaseController
│   ├── constant/      # Constants
│   └── exception/     # BizException / GlobalExceptionHandler
├── framework/         # 框架封装
│   └── security/      # JWT / Filter / LoginUser
└── modules/           # 业务模块
    └── auth/          # 认证（Phase 0: 健康检查）
```

## SQL 初始化
`sql/init.sql` 由 docker-compose 自动加载到 PostgreSQL。

## 测试账号
| 用户名 | 密码 |
| --- | --- |
| admin | admin123 |
