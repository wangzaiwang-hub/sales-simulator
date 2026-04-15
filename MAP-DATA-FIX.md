# 地图数据修复指南

## 问题描述

游戏页面出现黑屏，控制台显示错误：
```
Cannot GET /tools/tileset-editor
Failed to load resource: the server responded with a status of 404 (tileset-editor)
```

## 问题原因

数据库中的 SharedMap 表包含了无效的地图数据，其中的 tileset 路径指向了错误的 URL（如 `/tools/tileset-editor`），导致浏览器尝试加载这些路径作为图片资源。

## 解决方案

### 方案1：使用Node.js脚本清除（推荐）

在后端目录运行：

```bash
cd backend
node clear-shared-map.js
```

这个脚本会：
1. 删除所有无效的共享地图数据
2. 插入一个空的默认标记
3. 游戏将自动使用内置的默认地图

### 方案2：在Supabase Dashboard中手动清除

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 运行以下SQL：

```sql
-- 删除所有共享地图数据
DELETE FROM "SharedMap";

-- 插入默认标记
INSERT INTO "SharedMap" (id, name, "mapData", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'default', '{}', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

或者直接运行迁移脚本：
```bash
# 在Supabase SQL Editor中运行
backend/migrations/fix-shared-map-data.sql
```

### 方案3：在Railway后端重新部署

如果你已经修改了代码，需要重新部署后端：

1. 提交代码更改：
```bash
git add .
git commit -m "fix: 改进地图数据验证，过滤无效路径"
git push origin main
```

2. Railway会自动重新部署

3. 部署完成后，运行清除脚本或SQL

## 验证修复

1. 清除浏览器缓存
2. 刷新游戏页面
3. 应该能看到：
   - 角色正常显示
   - 默认的草地地图
   - 没有404错误

## 后续步骤

修复后，你可以：

1. 在地图编辑器中创建新地图
2. 保存地图到云端
3. 设置为激活地图

## 代码改进

已改进的代码：
- `backend/src/controllers/gameController.ts` - 增强了地图数据验证
  - 检测空对象
  - 检测新格式地图（对象格式）
  - 检测无效的tileset路径（包含 `/tools/`、`tileset-editor`、`localhost`）
  - 添加详细的日志输出

## 预防措施

为了避免将来出现类似问题：

1. 地图编辑器保存地图时，确保tileset路径是相对路径
2. 不要在地图数据中包含绝对URL或localhost路径
3. 定期检查SharedMap表的数据完整性

## 技术细节

### 默认地图结构

当检测到无效地图数据时，游戏会使用以下默认地图：

```javascript
{
  width: 20,
  height: 15,
  tileSize: 48,
  layers: [
    {
      name: "地面",
      visible: true,
      tileset: "CGS_RU_HouseFree/img/tilesets/CGS_Urban_A2.png",
      tileSize: 48,
      data: Array(15).fill(null).map(() => 
        Array(20).fill(null).map(() => ({
          x: 0,
          y: 0,
          collision: false
        }))
      )
    }
  ]
}
```

### 地图格式兼容性

游戏支持两种地图格式：

1. 旧格式（瓦片地图）：
   - 使用 `layers` 数组
   - 每个图层有 `tileset` 和 `data`
   - 适合简单的瓦片地图

2. 新格式（对象地图）：
   - 使用 `objects` 数组
   - 支持自由放置的素材对象
   - 目前游戏页面会回退到默认地图

## 相关文件

- `backend/src/controllers/gameController.ts` - 地图加载逻辑
- `backend/migrations/fix-shared-map-data.sql` - SQL修复脚本
- `backend/clear-shared-map.js` - Node.js清除脚本
- `frontend/src/app/game/page.tsx` - 游戏页面渲染
