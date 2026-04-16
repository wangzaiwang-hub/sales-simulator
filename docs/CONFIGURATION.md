# 配置完成状态

## ✅ 已配置

### Supabase
- **项目URL**: https://mfcgydquomrdgajuwwkg.supabase.co
- **Service Role Key**: 已配置（用于服务端）
- **状态**: ⚠️ 需要数据库密码

### SecondMe OAuth
- **Client ID**: 已配置
- **Client Secret**: 已配置
- **Redirect URI**: http://localhost:3000/auth/callback
- **状态**: ✅ 已配置

### JWT
- **Secret**: 已生成
- **状态**: ✅ 已配置

## ⚠️ 待完成

### 1. 获取Supabase数据库密码

你需要从Supabase获取数据库连接字符串：

1. 访问 https://supabase.com/dashboard/project/mfcgydquomrdgajuwwkg
2. 进入 Settings → Database
3. 找到 Connection string → URI
4. 复制完整的连接字符串（包含密码）
5. 更新 `backend/.env` 中的 `DATABASE_URL`

连接字符串格式：
```
postgresql://postgres.mfcgydquomrdgajuwwkg:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 2. 初始化数据库

获取数据库密码后，运行：

```bash
cd backend
npm run prisma:push
```

这会在Supabase中创建所有需要的表。

### 3. 配置SecondMe回调URL

在SecondMe开发者平台配置回调URL：
- 开发环境: `http://localhost:3000/auth/callback`
- 生产环境: `https://your-domain.vercel.app/auth/callback`

## 🚀 启动项目

配置完成后：

**终端1 - 后端**:
```bash
cd backend
npm run dev
```

**终端2 - 前端**:
```bash
cd frontend
npm run dev
```

访问: http://localhost:3000

## 📝 环境变量文件

### backend/.env
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres.mfcgydquomrdgajuwwkg:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
SECONDME_CLIENT_ID=your_secondme_client_id
SECONDME_CLIENT_SECRET=your_secondme_client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback
CORS_ORIGIN=http://localhost:3000
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SECONDME_CLIENT_ID=your_secondme_client_id
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback
```

生产环境推荐改用 Vercel 的 `BACKEND_URL` + 同域 `/api` rewrite，`NEXT_PUBLIC_API_URL` 主要用于本地开发。

## 🔐 安全提醒

- ⚠️ 不要将 `.env` 文件提交到Git
- ⚠️ Service Role Key 只能在服务端使用
- ⚠️ 如果 Client Secret 或 JWT Secret 曾经出现在仓库里，请立刻在对应平台轮换
- ⚠️ 生产环境需要更新所有URL和密钥
