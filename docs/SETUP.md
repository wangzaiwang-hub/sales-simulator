# 项目配置指南

## ✅ 已完成
- [x] 前端依赖安装完成
- [x] 后端依赖安装完成
- [x] Prisma客户端生成完成

## 📋 下一步配置

### 1. 配置Supabase数据库

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 进入项目设置 → Database → Connection string
4. 复制连接字符串（选择"URI"格式）
5. 在 `backend/.env` 中配置：

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"
```

### 2. 配置SecondMe OAuth

1. 访问 [SecondMe开发者文档](https://develop-docs.second.me/zh/docs)
2. 创建新应用
3. 配置回调URL：
   - 开发环境：`http://localhost:3000/auth/callback`
   - 生产环境：`https://your-domain.vercel.app/auth/callback`
4. 获取Client ID和Client Secret

**后端配置** (`backend/.env`)：
```env
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback
```

**前端配置** (`frontend/.env.local`)：
```env
NEXT_PUBLIC_SECONDME_CLIENT_ID=your_client_id
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. 生成JWT密钥

在终端运行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将生成的密钥配置到 `backend/.env`：
```env
JWT_SECRET=生成的密钥
```

### 4. 完整的环境变量配置

**backend/.env**：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# JWT配置
JWT_SECRET=你的JWT密钥
JWT_EXPIRES_IN=7d

# SecondMe OAuth配置
SECONDME_CLIENT_ID=你的client_id
SECONDME_CLIENT_SECRET=你的client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback

# CORS配置
CORS_ORIGIN=http://localhost:3000
```

**frontend/.env.local**：
```env
# API配置
NEXT_PUBLIC_API_URL=http://localhost:3001

# SecondMe OAuth配置
NEXT_PUBLIC_SECONDME_CLIENT_ID=你的client_id
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 5. 初始化数据库

配置好DATABASE_URL后，运行：

```bash
cd backend
npm run prisma:push
```

这会在Supabase中创建所有需要的表。

### 5.1 升级用户画像字段

如果你已经初始化过数据库，需要重新在 Supabase SQL Editor 运行一次：

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS interests JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personaSummary" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "npcBehavior" TEXT DEFAULT 'wander';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeProfile" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isNpcVisible" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeTokenScope" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeTokenExpiresAt" TIMESTAMP(3);
```

这些字段会用于：
- 保存 SecondMe 用户同步下来的职业、兴趣和分身摘要
- 保存 SecondMe 对话授权 token，用于让登录用户作为地图 NPC 发言
- 控制登录用户是否出现在别人地图里
- 驱动地图中的 NPC 行为模式

如果你之前已经登录过系统，想启用分身 NPC 对话，建议重新走一遍登录流程。
新版前端会请求 `userinfo chat.write` scope，让地图里的用户 NPC 能通过 SecondMe chat API 回复。

### 5.2 导入历史 SecondMe 用户作为 NPC

如果你想把已有的 SecondMe 用户资料直接导入成地图 NPC，可以运行：

`backend/seed-secondme-npcs.sql`

这份 SQL 会：
- 把用户写入 `User`
- 自动补 `GameProgress` 和 `Shop`
- 保存职业、兴趣、画像摘要和完整 `secondmeProfile`
- 保持 `isNpcVisible = true`

这些用户导入后会出现在别人的地图里；他们自己登录时，不会看到自己的 NPC。

### 6. 启动项目

**启动后端**（在backend目录）：
```bash
npm run dev
```
后端将运行在 http://localhost:3001

**启动前端**（在frontend目录）：
```bash
npm run dev
```
前端将运行在 http://localhost:3000

## 🚀 快速启动命令

创建两个终端窗口：

**终端1 - 后端**：
```bash
cd backend
npm run dev
```

**终端2 - 前端**：
```bash
cd frontend
npm run dev
```

## 🔍 验证安装

1. 访问 http://localhost:3001/health
   - 应该返回：`{"status":"ok","timestamp":"..."}`

2. 访问 http://localhost:3000
   - 应该看到游戏首页

## 📦 添加初始商品数据

连接到Supabase SQL编辑器，运行：

```sql
INSERT INTO "Product" (id, name, description, category, "basePrice", icon, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '苹果', '新鲜的红苹果', 'food', 10, 'apple.png', NOW(), NOW()),
  (gen_random_uuid(), '面包', '刚出炉的面包', 'food', 15, 'bread.png', NOW(), NOW()),
  (gen_random_uuid(), '水', '纯净水', 'drink', 5, 'water.png', NOW(), NOW()),
  (gen_random_uuid(), '咖啡', '香浓咖啡', 'drink', 20, 'coffee.png', NOW(), NOW()),
  (gen_random_uuid(), '笔记本', '学习用笔记本', 'stationery', 30, 'notebook.png', NOW(), NOW());
```

## ❓ 常见问题

### 数据库连接失败
- 检查DATABASE_URL是否正确
- 确认Supabase项目是否已启动
- 检查网络连接

### SecondMe登录失败
- 确认Client ID和Secret是否正确
- 检查回调URL是否匹配
- 查看浏览器控制台错误信息

### 端口被占用
- 修改backend/.env中的PORT
- 修改frontend/.env.local中的NEXT_PUBLIC_API_URL

## 📚 相关文档

- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [Supabase文档](https://supabase.com/docs)
- [SecondMe文档](https://develop-docs.second.me/zh/docs)
