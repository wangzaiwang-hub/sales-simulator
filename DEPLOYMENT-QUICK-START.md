# 快速部署指南

## 前置要求

1. 已有 GitHub 账号并推送代码到仓库
2. 已有 Supabase 项目并运行了数据库迁移
3. 已有 SecondMe OAuth 应用

## 快速开始

### 步骤 1: 检查环境变量

```bash
./check-env.sh
```

确保所有环境变量都已配置。

### 步骤 2: 部署后端到 Railway

#### 方式 A: 使用 Railway 网页控制台（推荐）

1. 访问 https://railway.app
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. 设置 Root Directory 为 `backend`
5. 添加环境变量（参考 `backend/.env.example`）
6. 点击 "Deploy"
7. 部署完成后，复制 Railway 提供的域名

#### 方式 B: 使用 CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
cd backend
railway init

# 链接到项目
railway link

# 添加环境变量（在 Railway 控制台）
# 然后部署
railway up
```

### 步骤 3: 部署前端到 Vercel

#### 方式 A: 使用 Vercel 网页控制台（推荐）

1. 访问 https://vercel.com
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 设置 Root Directory 为 `frontend`
5. 添加环境变量：
   ```
   NEXT_PUBLIC_SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
   NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://your-domain.vercel.app/auth/callback
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   BACKEND_URL=https://your-backend.railway.app
   ```
6. 点击 "Deploy"
7. 部署完成后，复制 Vercel 提供的域名

#### 方式 B: 使用 CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd frontend
vercel --prod
```

### 步骤 4: 更新环境变量

使用步骤 2 和步骤 3 获取的域名，更新环境变量：

#### 更新 Railway 环境变量：
```
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
SECONDME_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback
```

#### 更新 Vercel 环境变量：
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback
```

### 步骤 5: 重新部署

1. 在 Railway 控制台点击 "Redeploy"
2. 在 Vercel 控制台点击 "Redeploy"

### 步骤 6: 更新 SecondMe OAuth 回调地址

在 SecondMe 开发者控制台中，添加回调地址：
```
https://your-frontend.vercel.app/auth/callback
```

### 步骤 7: 测试

1. 访问前端域名：`https://your-frontend.vercel.app`
2. 测试登录功能
3. 测试游戏功能
4. 测试地图编辑器

## 环境变量清单

### 后端 (Railway)

| 变量名 | 说明 | 示例 |
|--------|------|------|
| PORT | 端口号 | 3001 |
| NODE_ENV | 环境 | production |
| BASE_URL | 后端域名 | https://xxx.railway.app |
| FRONTEND_URL | 前端域名 | https://xxx.vercel.app |
| CORS_ORIGIN | CORS来源 | https://xxx.vercel.app |
| SUPABASE_URL | Supabase URL | https://xxx.supabase.co |
| SUPABASE_SERVICE_KEY | Supabase密钥 | eyJhbGc... |
| DATABASE_URL | 数据库连接 | postgresql://... |
| JWT_SECRET | JWT密钥 | 随机字符串（32位+） |
| JWT_EXPIRES_IN | JWT过期时间 | 7d |
| SECONDME_CLIENT_ID | SecondMe客户端ID | xxx |
| SECONDME_CLIENT_SECRET | SecondMe客户端密钥 | xxx |
| SECONDME_REDIRECT_URI | OAuth回调地址 | https://xxx.vercel.app/auth/callback |

### 前端 (Vercel)

| 变量名 | 说明 | 示例 |
|--------|------|------|
| NEXT_PUBLIC_SECONDME_CLIENT_ID | SecondMe客户端ID | 3fd385c8-... |
| NEXT_PUBLIC_SECONDME_REDIRECT_URI | OAuth回调地址 | https://xxx.vercel.app/auth/callback |
| NEXT_PUBLIC_API_URL | 后端API地址 | https://xxx.railway.app |
| BACKEND_URL | 后端地址 | https://xxx.railway.app |

## 常见问题

### 1. 部署后出现 CORS 错误

检查后端的 `CORS_ORIGIN` 是否设置为前端域名。

### 2. API 请求失败

检查前端的 `NEXT_PUBLIC_API_URL` 是否正确。

### 3. OAuth 回调失败

检查 SecondMe 控制台的回调地址是否正确。

### 4. 静态资源加载失败

确保 Railway 正确部署了 `backend/resource` 目录。

### 5. 数据库连接失败

检查 Supabase 连接字符串和服务密钥。

## 监控

### Railway 日志
```
railway logs
```

### Vercel 日志
在 Vercel 控制台的 "Deployments" 标签查看。

## 回滚

### Railway
在控制台的 "Deployments" 中选择之前的版本并重新部署。

### Vercel
在控制台的 "Deployments" 中选择之前的版本并 "Promote to Production"。

## 成本

- Railway Hobby: $5/月
- Vercel Hobby: 免费
- Supabase Free: 免费

总计：约 $5/月（个人项目）

## 下一步

1. 配置自定义域名
2. 启用 HTTPS（自动）
3. 配置监控和告警
4. 设置自动备份
5. 优化性能

详细信息请参考 `DEPLOYMENT.md`。
