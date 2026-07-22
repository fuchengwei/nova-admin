# syntax=docker/dockerfile:1

# ============================================================
# Build stage — 编译 Spring Boot 4 (Java 25) 应用
# ============================================================
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build

# 先拷贝 pom 以利用层缓存下载依赖
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B dependency:go-offline

# 再拷贝源码并打包（跳过测试以加快构建，CI 中应单独跑测试）
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B clean package -DskipTests

# ============================================================
# Runtime stage — 仅运行 Jar
# ============================================================
FROM eclipse-temurin:25-jre
WORKDIR /app

# 运行所需环境变量（生产环境请通过 compose / k8s 注入）
ENV TZ=Asia/Shanghai \
    JAVA_OPTS="-XX:+UseZGC -XX:MaxRAMPercentage=75 -Dfile.encoding=UTF-8"

COPY --from=build /build/target/nova-admin-backend.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
