-- 添加共享地图表
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 共享地图表
CREATE TABLE IF NOT EXISTS "SharedMap" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL DEFAULT 'main',
    "mapData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("createdBy") REFERENCES "User"(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "SharedMap_name_idx" ON "SharedMap"(name);
CREATE INDEX IF NOT EXISTS "SharedMap_isActive_idx" ON "SharedMap"("isActive");

-- 插入默认地图（如果不存在）
INSERT INTO "SharedMap" (id, name, "mapData", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'main', 'main', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

SELECT '✅ 共享地图表创建完成！' as status;
