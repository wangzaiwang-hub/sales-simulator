# 云端部署指南

## 架构
- 前端：Vercel (Next.js)
- 后端：Railway (Node.js + Express)
- 数据库：Supabase (PostgreSQL)

## 部署步骤

### 1. 后端部署到 Railway

#### 1.1 准备工作
1. 注册 Railway 账号：https://railway.app
2. 安装 Railway CLI（可选）：`npm install -g @railway/cli`

#### 1.2 创建项目
1. 在 Railway 控制台点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 连接你的 GitHub 仓库
4. 选择 `backend` 目录作为根目录

#### 1.3 配置环境变量
在 Railway 项目设置中添加以下环境变量：

```bash
# 服务器配置
PORT=3001
NODE_ENV=production
BASE_URL=https://your-backend-domain.railway.app
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Supabase配置
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@db.example.supabase.co:5432/postgres

# JWT配置
JWT_SECRET=生成一个随机字符串（至少32位）
JWT_EXPIRES_IN=7d

# SecondMe OAuth配置
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_REDIRECT_URI=https://your-frontend-domain.vercel.app/auth/callback
```

#### 1.4 配置构建设置
Railway 会自动检测 `railway.json` 配置文件。确保以下设置：
- Root Directory: `backend`
- Build Command: `npm run build`
- Start Command: `npm start`

#### 1.5 获取后端域名
部署成功后，Railway 会提供一个域名，例如：
`https://your-project-name.up.railway.app`

记下这个域名，后面配置前端时需要用到。

---

### 2. 前端部署到 Vercel

#### 2.1 准备工作
1. 注册 Vercel 账号：https://vercel.com
2. 安装 Vercel CLI（可选）：`npm install -g vercel`

#### 2.2 创建项目
1. 在 Vercel 控制台点击 "Add New Project"
2. 导入你的 GitHub 仓库
3. 选择 `frontend` 目录作为根目录
4. Framework Preset 选择 "Next.js"

#### 2.3 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

```bash
# SecondMe OAuth配置
NEXT_PUBLIC_SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://your-frontend-domain.vercel.app/auth/callback

# API配置（使用步骤1.5获取的后端域名）
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
BACKEND_URL=https://your-backend-domain.railway.app
```

#### 2.4 配置构建设置
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### 2.5 获取前端域名
部署成功后，Vercel 会提供一个域名，例如：
`https://your-project-name.vercel.app`

---

### 3. 更新配置

#### 3.1 更新后端环境变量
使用步骤 2.5 获取的前端域名，更新 Railway 中的环境变量：
- `FRONTEND_URL=https://your-frontend-domain.vercel.app`
- `CORS_ORIGIN=https://your-frontend-domain.vercel.app`
- `SECONDME_REDIRECT_URI=https://your-frontend-domain.vercel.app/auth/callback`

#### 3.2 更新前端环境变量
使用步骤 1.5 获取的后端域名，更新 Vercel 中的环境变量：
- `NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app`
- `BACKEND_URL=https://your-backend-domain.railway.app`

#### 3.3 重新部署
1. 在 Railway 中触发重新部署
2. 在 Vercel 中触发重新部署

---

### 4. 数据库迁移

#### 4.1 运行迁移脚本
在 Supabase Dashboard 的 SQL Editor 中依次运行以下脚本：

1. `backend/init-database.sql` - 初始化数据库表
2. `backend/migrations/add-npc-personality.sql` - 添加NPC性格系统
3. `backend/migrations/add-relationship-system.sql` - 添加关系系统
4. `backend/migrations/add-chat-history.sql` - 添加聊天历史
5. `backend/migrations/add-shared-map.sql` - 添加共享地图
6. `backend/prisma/migrations/add-character-appearance.sql` - 添加角色外观

---

### 5. SecondMe OAuth 配置

#### 5.1 更新回调地址
在 SecondMe 开发者控制台中，更新 OAuth 回调地址：
- 添加：`https://your-frontend-domain.vercel.app/auth/callback`

---

### 6. 验证部署

#### 6.1 检查后端健康状态
访问：`https://your-backend-domain.railway.app/health`
应该返回：`{"status":"ok","timestamp":"..."}`

#### 6.2 检查前端
访问：`https://your-frontend-domain.vercel.app`
应该能看到登录页面

#### 6.3 测试完整流程
1. 注册/登录
2. 创建角色
3. 进入游戏
4. 与NPC对话
5. 使用地图编辑器

---

## 常见问题

### 1. CORS 错误
确保后端的 `CORS_ORIGIN` 环境变量设置为前端域名。

### 2. API 请求失败
检查前端的 `NEXT_PUBLIC_API_URL` 是否正确指向后端域名。

### 3. OAuth 回调失败
确保 SecondMe 控制台中的回调地址与前端域名一致。

### 4. 数据库连接失败
检查 Supabase 的连接字符串和服务密钥是否正确。

### 5. 地图编辑器资源加载失败
确保后端的静态资源路径配置正确，Railway 需要正确部署 `resource` 目录。

---

## 监控和日志

### Railway 日志
在 Railway 控制台的 "Deployments" 标签中查看实时日志。

### Vercel 日志
在 Vercel 控制台的 "Deployments" 标签中查看构建和运行时日志。

### Supabase 日志
在 Supabase Dashboard 的 "Logs" 标签中查看数据库查询日志。

---

## 性能优化

### 1. 启用 CDN
Vercel 自动启用全球 CDN，无需额外配置。

### 2. 数据库索引
确保 Supabase 中的表已创建必要的索引（迁移脚本中已包含）。

### 3. 图片优化
使用 Next.js 的 Image 组件自动优化图片。

### 4. 缓存策略
后端已配置静态资源缓存（1年）。

---

## 成本估算

### Railway
- Hobby Plan: $5/月（500小时运行时间）
- Pro Plan: $20/月（无限运行时间）

### Vercel
- Hobby Plan: 免费（个人项目）
- Pro Plan: $20/月（商业项目）

### Supabase
- Free Plan: 免费（500MB数据库，1GB文件存储）
- Pro Plan: $25/月（8GB数据库，100GB文件存储）

---

## 备份和恢复

### 数据库备份
Supabase 自动每天备份，Pro Plan 可以手动触发备份。

### 代码备份
使用 Git 版本控制，推送到 GitHub。

---

## 安全建议

1. 定期更新依赖包：`npm audit fix`
2. 使用强密码和随机 JWT_SECRET
3. 启用 Supabase 的 Row Level Security (RLS)
4. 定期检查 Railway 和 Vercel 的安全日志
5. 不要在代码中硬编码敏感信息

---

## 联系支持

- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
