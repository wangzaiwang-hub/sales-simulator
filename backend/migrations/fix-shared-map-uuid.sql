-- 修复SharedMap表的UUID类型
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 1. 删除旧表（如果需要保留数据，请先备份）
DROP TABLE IF EXISTS "SharedMap" CASCADE;

-- 2. 重新创建表，使用UUID类型
CREATE TABLE "SharedMap" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "mapData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("createdBy") REFERENCES "User"(id) ON DELETE SET NULL
);

-- 3. 创建索引
CREATE INDEX "SharedMap_name_idx" ON "SharedMap"(name);
CREATE INDEX "SharedMap_isActive_idx" ON "SharedMap"("isActive");

-- 4. 插入默认地图
INSERT INTO "SharedMap" (name, "mapData", "isActive")
VALUES ('默认地图', '{"gridSize":48,"cols":20,"rows":15,"width":960,"height":720,"layers":[{"id":0,"name":"图层 0","visible":true,"locked":false}],"objects":[],"collisionAreas":[]}', TRUE);

SELECT '✅ SharedMap表已修复为UUID类型！' as status;
