-- 修复共享地图数据
-- 清除包含无效路径的地图数据
-- 在Supabase Dashboard → SQL Editor 中运行此脚本

-- 删除所有现有的共享地图数据（它们包含错误的路径）
DELETE FROM "SharedMap";

-- 插入一个默认的空地图标记
-- 这样游戏控制器会检测到没有有效地图，并使用默认地图
INSERT INTO "SharedMap" (id, name, "mapData", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'default', '{}', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

SELECT '✅ 共享地图数据已清除！游戏将使用默认地图。' as status;
