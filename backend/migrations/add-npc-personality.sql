-- 添加NPC性格特征字段
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 为User表添加性格特征字段
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "personalityTraits" JSONB DEFAULT '{}';

-- 性格特征包括：
-- openness: 开放性 (0-100) - 高分：好奇、创新；低分：保守、传统
-- conscientiousness: 尽责性 (0-100) - 高分：有条理、负责；低分：随性、灵活
-- extraversion: 外向性 (0-100) - 高分：社交、活跃；低分：内向、安静
-- agreeableness: 宜人性 (0-100) - 高分：友善、合作；低分：竞争、直率
-- neuroticism: 神经质 (0-100) - 高分：敏感、情绪化；低分：稳定、冷静

-- 添加当前情绪状态字段
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentMood" TEXT DEFAULT 'neutral';
-- 可能的情绪：happy, sad, angry, excited, tired, focused, confused, calm, anxious

-- 添加社交偏好字段
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialPreference" TEXT DEFAULT 'moderate';
-- 可能的值：very_introverted, introverted, moderate, extroverted, very_extroverted

-- 添加活动状态字段
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activityStatus" TEXT DEFAULT 'idle';
-- 可能的状态：idle, thinking, busy, chatting, working, resting

-- 更新现有用户的默认性格（基于随机但合理的分布）
UPDATE "User" 
SET "personalityTraits" = jsonb_build_object(
    'openness', 50 + (random() * 40 - 20)::int,
    'conscientiousness', 50 + (random() * 40 - 20)::int,
    'extraversion', 50 + (random() * 40 - 20)::int,
    'agreeableness', 50 + (random() * 40 - 20)::int,
    'neuroticism', 50 + (random() * 40 - 20)::int
)
WHERE "personalityTraits" = '{}' OR "personalityTraits" IS NULL;

SELECT '✅ NPC性格特征字段添加完成！' as status;
