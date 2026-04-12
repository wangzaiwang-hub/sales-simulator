-- 销售模拟器数据库初始化脚本
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 用户表
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    "secondmeId" TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    profession TEXT,
    interests JSONB,
    "personaSummary" TEXT,
    "npcBehavior" TEXT DEFAULT 'wander',
    "secondmeProfile" JSONB,
    "isNpcVisible" BOOLEAN NOT NULL DEFAULT TRUE,
    "secondmeAccessToken" TEXT,
    "secondmeApiKey" TEXT,
    "secondmeTokenScope" TEXT,
    "secondmeTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS interests JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personaSummary" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "npcBehavior" TEXT DEFAULT 'wander';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeProfile" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isNpcVisible" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeApiKey" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeTokenScope" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "secondmeTokenExpiresAt" TIMESTAMP(3);

-- 游戏进度表
CREATE TABLE IF NOT EXISTS "GameProgress" (
    id TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 1000,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "currentMap" TEXT NOT NULL DEFAULT 'main',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- 商店表
CREATE TABLE IF NOT EXISTS "Shop" (
    id TEXT PRIMARY KEY,
    "userId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    reputation INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- 商品定义表
CREATE TABLE IF NOT EXISTS "Product" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    icon TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE IF NOT EXISTS "Inventory" (
    id TEXT PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("shopId") REFERENCES "Shop"(id) ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Product"(id),
    UNIQUE("shopId", "productId")
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS "Transaction" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "npcName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id)
);

-- 交易项目表
CREATE TABLE IF NOT EXISTS "TransactionItem" (
    id TEXT PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"(id) ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "Product"(id)
);

-- 插入一些初始商品数据
INSERT INTO "Product" (id, name, description, category, "basePrice", icon, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, '苹果', '新鲜的红苹果', 'food', 10, 'apple.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '面包', '刚出炉的面包', 'food', 15, 'bread.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '水', '纯净水', 'drink', 5, 'water.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '咖啡', '香浓咖啡', 'drink', 20, 'coffee.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, '笔记本', '学习用笔记本', 'stationery', 30, 'notebook.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS "GameProgress_userId_idx" ON "GameProgress"("userId");
CREATE INDEX IF NOT EXISTS "Shop_userId_idx" ON "Shop"("userId");
CREATE INDEX IF NOT EXISTS "Inventory_shopId_idx" ON "Inventory"("shopId");
CREATE INDEX IF NOT EXISTS "Inventory_productId_idx" ON "Inventory"("productId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");
CREATE INDEX IF NOT EXISTS "TransactionItem_productId_idx" ON "TransactionItem"("productId");

SELECT '✅ 数据库初始化完成！' as status;
