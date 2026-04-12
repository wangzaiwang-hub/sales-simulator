-- 添加角色外观字段到GameProgress表
ALTER TABLE "GameProgress" 
ADD COLUMN IF NOT EXISTS "characterAppearance" JSONB;

-- 设置默认值为随机外观
COMMENT ON COLUMN "GameProgress"."characterAppearance" IS '角色外观配置 {character, tops, bottoms, shoes, hair, eyes}';
