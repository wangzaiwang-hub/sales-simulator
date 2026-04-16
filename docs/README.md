# 销售模拟器 (Sales Simulator)

一个基于2D像素风格的销售模拟游戏，玩家可以经营商店、与NPC互动、完成销售任务。

## 技术栈

### 前端
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Phaser 3 (游戏引擎)
- Zustand (状态管理)

### 后端
- Node.js + Express
- TypeScript
- Prisma (ORM)
- JWT认证

### 数据库
- Supabase (PostgreSQL)

### 登录
- SecondMe OAuth

## 项目结构

```
sales-simulator/
├── frontend/          # Next.js前端应用
├── backend/           # Express后端API
└── docs/             # 文档
```

## 快速开始

### 前置要求
- Node.js 20+
- npm或yarn
- Supabase账号
- SecondMe开发者账号

### 1. 克隆项目

```bash
git clone <repository-url>
cd sales-simulator
```

### 2. 配置后端

```bash
cd backend
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑.env文件，填入你的配置
# - DATABASE_URL: Supabase数据库连接字符串
# - JWT_SECRET: JWT密钥
# - SECONDME_CLIENT_ID: SecondMe客户端ID
# - SECONDME_CLIENT_SECRET: SecondMe客户端密钥

# 初始化数据库
npm run prisma:push
npm run prisma:generate

# 启动开发服务器
npm run dev
```

后端将运行在 http://localhost:3001

### 3. 配置前端

```bash
cd frontend
npm install

# 复制环境变量文件
cp .env.example .env.local

# 编辑.env.local文件
# - BACKEND_URL: Railway后端地址（生产部署）
# - NEXT_PUBLIC_SECONDME_CLIENT_ID: SecondMe客户端ID

# 启动开发服务器
npm run dev
```

前端将运行在 http://localhost:3000

## 部署

### 前端部署到Vercel

1. 在Vercel中导入项目
2. 设置根目录为 `frontend`
3. 配置环境变量：
   - `BACKEND_URL`
   - `NEXT_PUBLIC_SECONDME_CLIENT_ID`
   - `NEXT_PUBLIC_SECONDME_REDIRECT_URI`
4. 部署

### 后端部署到Railway

1. 在Railway中创建新项目
2. 连接GitHub仓库
3. 设置根目录为 `backend`
4. 配置环境变量：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SECONDME_CLIENT_ID`
   - `SECONDME_CLIENT_SECRET`
   - `CORS_ORIGIN`
5. 部署

### 数据库配置 (Supabase)

1. 在Supabase创建新项目
2. 获取数据库连接字符串
3. 在Railway中配置 `DATABASE_URL`
4. 运行Prisma迁移：
   ```bash
   npm run prisma:push
   ```

## SecondMe OAuth配置

1. 访问 [SecondMe开发者平台](https://develop-docs.second.me/zh/docs)
2. 创建新应用
3. 配置回调URL：`https://your-domain.com/auth/callback`
4. 获取Client ID和Client Secret
5. 在环境变量中配置

## API文档

### 认证
- `POST /api/auth/secondme` - SecondMe登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户

### 游戏
- `GET /api/game/progress` - 获取游戏进度
- `PUT /api/game/progress` - 更新游戏进度
- `POST /api/game/transaction` - 创建交易
- `GET /api/game/transactions` - 获取交易历史

### 商店
- `GET /api/shop` - 获取商店信息
- `GET /api/shop/inventory` - 获取库存
- `PUT /api/shop/inventory/:productId` - 更新库存

### 商品
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情

## 开发

### 添加新商品

在数据库中插入商品数据：

```sql
INSERT INTO "Product" (id, name, description, category, "basePrice", icon)
VALUES (
  gen_random_uuid(),
  '苹果',
  '新鲜的红苹果',
  'food',
  10,
  'apple.png'
);
```

### 游戏素材

游戏素材统一放在 `frontend/public/`，包括：
- 角色精灵图
- 地图瓦片
- UI图标

## 许可证

MIT
