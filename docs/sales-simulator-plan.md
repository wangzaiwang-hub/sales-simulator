# 销售模拟器项目规划

## 项目概述
一个基于2D像素风格的销售模拟游戏，玩家可以经营商店、与NPC互动、完成销售任务。

## 技术栈

### 前端 (Vercel)
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **游戏引擎**: Phaser 3
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **登录**: SecondMe OAuth

### 后端 (Railway)
- **运行时**: Node.js 20
- **框架**: Express + TypeScript
- **ORM**: Prisma
- **认证**: JWT + SecondMe OAuth
- **验证**: Zod

### 数据库 (Supabase)
- **类型**: PostgreSQL
- **ORM**: Prisma

## 项目结构

```
sales-simulator/
├── frontend/                 # Next.js前端
│   ├── src/
│   │   ├── app/             # App Router页面
│   │   ├── components/      # React组件
│   │   ├── game/            # Phaser游戏逻辑
│   │   ├── lib/             # 工具函数
│   │   ├── store/           # Zustand状态
│   │   └── types/           # TypeScript类型
│   ├── public/              # 静态资源（游戏素材）
│   └── package.json
│
├── backend/                  # Express后端
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 业务逻辑
│   │   ├── prisma/          # Prisma schema
│   │   └── types/           # TypeScript类型
│   └── package.json
│
└── docs/                     # 文档
```

## 核心功能模块

### 1. 用户系统
- SecondMe OAuth登录
- 用户资料管理
- 游戏进度保存

### 2. 游戏世界
- 2D像素地图（复用现有资源）
- 角色移动和动画
- NPC互动系统

### 3. 商店系统
- 商品管理
- 库存系统
- 定价策略

### 4. 销售系统
- 客户NPC
- 销售对话
- 交易完成

### 5. 经济系统
- 金币/货币
- 收入/支出
- 升级系统

## 数据库设计

### 主要表
- `users` - 用户信息
- `game_progress` - 游戏进度
- `shops` - 商店信息
- `inventory` - 库存
- `products` - 商品
- `transactions` - 交易记录
- `npcs` - NPC数据

## API设计

### 认证
- `POST /api/auth/secondme` - SecondMe登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户

### 游戏
- `GET /api/game/progress` - 获取游戏进度
- `PUT /api/game/progress` - 保存游戏进度
- `GET /api/game/shop` - 获取商店信息
- `POST /api/game/transaction` - 创建交易

### 商品
- `GET /api/products` - 获取商品列表
- `GET /api/inventory` - 获取库存

## 部署配置

### Vercel (前端)
- 环境变量: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SECONDME_CLIENT_ID`
- 构建命令: `npm run build`
- 输出目录: `.next`

### Railway (后端)
- 环境变量: `DATABASE_URL`, `JWT_SECRET`, `SECONDME_CLIENT_SECRET`
- 启动命令: `npm run start`
- 端口: 自动分配

### Supabase (数据库)
- 获取连接字符串
- 配置到Railway环境变量

## 开发步骤

1. ✅ 项目规划
2. 创建前端项目（Next.js）
3. 创建后端项目（Express）
4. 配置Prisma + Supabase
5. 实现SecondMe登录
6. 实现游戏核心逻辑
7. 集成Phaser游戏引擎
8. 测试和优化
9. 部署到生产环境
