# 紧急修复：立即清除数据库

## 问题根源
数据库中的 SharedMap 表仍然包含错误的地图数据，导致游戏尝试加载 `/tools/tileset-editor` 这个不存在的路径。

## 立即执行（1分钟）

### 步骤1：登录 Supabase
1. 访问：https://supabase.com/dashboard
2. 登录你的账号
3. 选择你的项目

### 步骤2：清除数据
1. 点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制粘贴以下SQL：

```sql
-- 删除所有地图数据
DELETE FROM "SharedMap";

-- 确认已清除
SELECT COUNT(*) FROM "SharedMap";
```

4. 点击 "Run" 按钮
5. 应该显示 count = 0

### 步骤3：刷新游戏
1. 清除浏览器缓存（Cmd+Shift+R 或 Ctrl+Shift+R）
2. 刷新页面：https://sales-simulator-zeta.vercel.app/game

## 预期结果
- ✅ 没有 "Cannot GET /tools/tileset-editor" 错误
- ✅ 看到默认的草地地图
- ✅ 角色可以正常移动

## 为什么必须这样做？

之前在地图编辑器中保存的地图数据包含了错误的图片路径。这些路径在生产环境中不存在，导致浏览器尝试加载时返回404错误。

虽然我已经修改了后端代码来过滤这些无效数据，但是：
1. 数据库中的数据不会自动删除
2. 必须手动清除才能生效

## 如果还是不行

如果清除数据库后还是有问题，请：
1. 打开浏览器控制台（F12）
2. 查看 Network 标签页
3. 找到失败的请求
4. 截图发给我

## 后续使用地图编辑器

清除后，你可以：
1. 访问 https://sales-simulator-zeta.vercel.app/map-editor
2. 创建新地图
3. 保存到云端

但要注意：
- 确保图片路径是相对路径
- 不要包含 `/tools/` 或 `localhost`
- 图片应该放在前端的 public 目录
