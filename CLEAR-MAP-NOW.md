# 立即清除无效地图数据

## 问题
游戏页面仍然显示 `Cannot GET /tools/tileset-editor` 错误，说明数据库中还有无效的地图数据。

## 解决方法（2分钟）

### 步骤1：登录 Supabase
访问：https://supabase.com/dashboard
登录你的账号

### 步骤2：进入 SQL Editor
1. 选择你的项目
2. 点击左侧菜单的 "SQL Editor"
3. 点击 "New query"

### 步骤3：运行清除SQL
复制以下SQL并点击 "Run"：

```sql
-- 查看当前的地图数据
SELECT id, name, "isActive", LEFT("mapData", 100) as preview 
FROM "SharedMap";

-- 删除所有地图数据
DELETE FROM "SharedMap";

-- 确认已清除
SELECT COUNT(*) as remaining_maps FROM "SharedMap";
```

### 步骤4：刷新游戏页面
1. 清除浏览器缓存（Cmd+Shift+R 或 Ctrl+Shift+R）
2. 刷新 https://sales-simulator-zeta.vercel.app/game

## 预期结果
- ✅ 没有 404 错误
- ✅ 看到默认的草地地图
- ✅ 角色可以正常移动

## 如果还是不行

检查浏览器控制台，看是否还有其他错误。如果有，请告诉我具体的错误信息。

## 为什么会这样？

之前在地图编辑器中保存的地图数据包含了错误的图片路径（`/tools/tileset-editor`），这些路径在生产环境中不存在。清除这些数据后，游戏会使用内置的默认地图。

## 后续

清除后，你可以：
1. 在本地的地图编辑器（`backend/map-editor.html`）中创建新地图
2. 保存到云端数据库
3. 设置为激活地图

但要确保地图数据中的图片路径是正确的相对路径，不要包含 `/tools/` 或 `localhost` 这样的路径。
