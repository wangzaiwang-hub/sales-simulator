-- 添加聊天记录表
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 创建聊天记录表
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL, -- 发送者ID
    "targetUserId" TEXT NOT NULL, -- 接收者ID（NPC）
    "message" TEXT NOT NULL, -- 消息内容
    "reply" TEXT, -- NPC回复内容
    "source" TEXT, -- 回复来源：secondme-visitor, secondme-chat, local-fallback, rejected
    "affinity" INTEGER, -- 当时的好感度
    "familiarity" INTEGER, -- 当时的熟悉度
    "relationshipType" TEXT, -- 当时的关系类型
    "affinityChange" INTEGER, -- 好感度变化
    "familiarityChange" INTEGER, -- 熟悉度变化
    "aiReasoning" TEXT, -- AI评判理由
    "aiEmotionalResponse" TEXT, -- AI情绪反应
    "npcMoodBefore" TEXT, -- NPC对话前的心情
    "npcMoodAfter" TEXT, -- NPC对话后的心情
    "npcStatusBefore" TEXT, -- NPC对话前的状态
    "npcStatusAfter" TEXT, -- NPC对话后的状态
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("targetUserId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "ChatMessage_userId_idx" ON "ChatMessage"("userId");
CREATE INDEX IF NOT EXISTS "ChatMessage_targetUserId_idx" ON "ChatMessage"("targetUserId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_userId_targetUserId_idx" ON "ChatMessage"("userId", "targetUserId");

-- 创建视图：获取用户与某个NPC的聊天历史
CREATE OR REPLACE VIEW "ChatHistory" AS
SELECT 
    cm.id,
    cm."userId",
    cm."targetUserId",
    u1.username as "userName",
    u2.username as "targetUserName",
    cm.message,
    cm.reply,
    cm.source,
    cm.affinity,
    cm.familiarity,
    cm."relationshipType",
    cm."affinityChange",
    cm."familiarityChange",
    cm."aiReasoning",
    cm."aiEmotionalResponse",
    cm."npcMoodBefore",
    cm."npcMoodAfter",
    cm."npcStatusBefore",
    cm."npcStatusAfter",
    cm."createdAt"
FROM "ChatMessage" cm
LEFT JOIN "User" u1 ON cm."userId" = u1.id
LEFT JOIN "User" u2 ON cm."targetUserId" = u2.id
ORDER BY cm."createdAt" DESC;

SELECT '✅ 聊天记录表创建完成！' as status;
