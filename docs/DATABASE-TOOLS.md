# 数据库工具说明

## 可用工具

### 1. 检查数据库状态
检查数据库表是否存在以及数据内容：

```bash
cd backend
node check-database.js
```

这个脚本会检查：
- SharedMap 表（共享地图）
- GameProgress 表（用户游戏进度）
- User 表（用户信息）

### 2. 复制地图到共享地图
将有地图数据的用户地图复制到共享地图表：

```bash
cd backend
node copy-map-to-shared.js
```

这个脚本会：
1. 查找有有效地图数据的用户
2. 验证地图数据格式
3. 将地图数据复制到 SharedMap 表
4. 所有用户将看到相同的地图

## 共享地图工作原理

### 数据库结构

```
SharedMap 表：
- id: 地图ID
- name: 地图名称（默认 "main"）
- mapData: 地图JSON数据
- isActive: 是否激活（true表示当前使用的地图）
- createdBy: 创建者用户ID
- createdAt: 创建时间
- updatedAt: 更新时间
```

### API逻辑

当用户请求地图时（GET /api/game/map）：
1. 首先查询 SharedMap 表中 isActive=true 的记录
2. 如果找到共享地图且有有效数据，返回共享地图
3. 否则回退到用户个人地图（GameProgress.currentMap）

### 保存地图

在 tileset-editor.html 中保存地图时：
- 默认保存到用户个人地图（GameProgress.currentMap）
- 如果需要保存为共享地图，需要在API调用中设置 `saveAsShared: true`

## 常见问题

### Q: 为什么其他用户看不到地图？

A: 可能的原因：
1. SharedMap 表不存在 → 运行 `backend/migrations/add-shared-map.sql`
2. SharedMap 表中没有有效数据 → 运行 `node copy-map-to-shared.js`
3. 没有用户创建过地图 → 在 tileset-editor.html 中创建并保存地图

### Q: 如何更新共享地图？

A: 有两种方式：
1. 使用 tileset-editor.html 保存地图（需要修改前端代码支持 saveAsShared 参数）
2. 运行 `node copy-map-to-shared.js` 将最新的用户地图复制到共享地图

### Q: 如何查看当前共享地图状态？

A: 运行检查脚本：
```bash
cd backend
node check-database.js
```

### Q: 多个用户同时编辑地图会怎样？

A: 当前实现：
- 每个用户可以编辑自己的个人地图
- 共享地图需要手动更新（通过脚本或API）
- 最后保存的地图会覆盖之前的共享地图

## 未来改进

可以考虑的功能：
1. 在前端添加"保存为共享地图"按钮
2. 添加地图版本控制
3. 添加地图编辑权限管理
4. 实时同步地图更新
5. 地图历史记录和回滚功能

## 数据库迁移

如果 SharedMap 表不存在，在 Supabase Dashboard → SQL Editor 中运行：

```sql
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

CREATE INDEX IF NOT EXISTS "SharedMap_name_idx" ON "SharedMap"(name);
CREATE INDEX IF NOT EXISTS "SharedMap_isActive_idx" ON "SharedMap"("isActive");

-- 插入默认地图
INSERT INTO "SharedMap" (id, name, "mapData", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'main', 'main', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
```

## 当前状态

根据最近的检查（2026-04-10）：
- ✅ SharedMap 表已创建
- ✅ 共享地图已有有效数据（130597字符）
- ✅ 地图规格：20x15，瓦片大小48，7个图层
- ✅ 所有用户现在应该能看到共享地图
