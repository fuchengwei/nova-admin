# syntax=docker/dockerfile:1

# ============================================================
# Build stage — 构建 Vite 8 (React 19) 前端
# 项目要求 Node >= 20.19，这里使用 Node 22 LTS
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

# 先安装依赖（利用层缓存）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建产物
COPY . .
RUN pnpm build

# ============================================================
# Serve stage — Nginx 提供静态资源并反向代理 /api
# ============================================================
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
