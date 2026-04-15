# 快速修复：地图不显示问题

## 问题
游戏页面黑屏，控制台显示 `Cannot GET /tools/tileset-editor` 错误

## 原因
数据库中的地图数据包含无效的路径

## 立即修复（3步）

### 1. 等待Railway自动部署
代码已推送到GitHub，Railway会自动重新部署后端（约2-3分钟）

### 2. 清除数据库中的无效地图

选择以下任一方法：

#### 方法A：使用脚本（推荐）
```bash
cd backend
node clear-shared-map.js
```

#### 方法B：在Supabase中运行SQL
登录 Supabase Dashboard → SQL Editor，运行：
```sql
DELETE FROM "SharedMap";
INSERT INTO "SharedMap" (id, name, "mapData", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'default', '{}', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### 3. 刷新游戏页面
清除浏览器缓存并刷新 https://sales-simulator-zeta.vercel.app/game

## 预期结果
- ✅ 角色正常显示
- ✅ 看到默认的草地地图
- ✅ 没有404错误
- ✅ 可以正常移动和互动

## 后续
修复后，你可以在地图编辑器中创建新地图并设为激活。

## 详细文档
查看 `MAP-DATA-FIX.md` 了解更多技术细节。
