-- 添加NPC关系和好感度系统
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 创建关系表
CREATE TABLE IF NOT EXISTS "Relationship" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "affinity" INTEGER NOT NULL DEFAULT 0, -- 好感度 -100 到 100
    "familiarity" INTEGER NOT NULL DEFAULT 0, -- 熟悉度 0 到 100
    "lastInteractionAt" TIMESTAMP(3),
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "relationshipType" TEXT DEFAULT 'stranger', -- stranger, acquaintance, friend, close_friend, rival, enemy
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("targetUserId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE("userId", "targetUserId")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "Relationship_userId_idx" ON "Relationship"("userId");
CREATE INDEX IF NOT EXISTS "Relationship_targetUserId_idx" ON "Relationship"("targetUserId");
CREATE INDEX IF NOT EXISTS "Relationship_affinity_idx" ON "Relationship"("affinity");

-- 添加互动历史表（可选，用于记录详细互动）
CREATE TABLE IF NOT EXISTS "InteractionHistory" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "relationshipId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL, -- chat, gift, help, conflict, ignore
    "affinityChange" INTEGER NOT NULL DEFAULT 0,
    "familiarityChange" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("relationshipId") REFERENCES "Relationship"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "InteractionHistory_relationshipId_idx" ON "InteractionHistory"("relationshipId");
CREATE INDEX IF NOT EXISTS "InteractionHistory_createdAt_idx" ON "InteractionHistory"("createdAt");

SELECT '✅ 关系和好感度系统创建完成！' as status;
