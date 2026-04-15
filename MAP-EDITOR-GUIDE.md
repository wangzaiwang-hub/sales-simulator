# 云端地图编辑器使用指南

## 访问地图编辑器

### 方法1：从游戏内访问（推荐）
1. 访问游戏页面：https://sales-simulator-zeta.vercel.app/game
2. 按 ESC 键打开菜单
3. 点击"地图编辑器"按钮

### 方法2：直接访问
访问：https://sales-simulator-zeta.vercel.app/map-editor

## 等待部署完成

代码已推送到GitHub，需要等待：
- Vercel 前端部署（约2-3分钟）
- Railway 后端部署（约2-3分钟）

你可以在以下位置查看部署状态：
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard

## 使用地图编辑器

### 1. 创建新地图
- 设置地图尺寸（格子数）
- 设置格子大小（像素）
- 点击"新建地图"

### 2. 添加素材
- 上传瓦片集图片
- 设置瓦片大小
- 点击素材放置到地图上

### 3. 设置碰撞
- 选中素材
- 点击"碰撞"按钮
- 调整碰撞框大小和位置

### 4. 保存地图
- 输入地图名称
- 点击"💾 保存到云端"
- 地图会保存到数据库

### 5. 设为激活地图
- 在地图列表中选择地图
- 点击"设为激活地图"
- 游戏将使用这个地图

## 重要提示

### 资源路径
- 素材图片应该放在前端的 `public` 目录下
- 或者使用相对路径（如 `resource/xxx.png`）
- 不要使用绝对路径或 localhost 路径

### 地图格式
- 编辑器保存的是"新格式"地图（对象格式）
- 目前游戏页面会回退到默认地图
- 需要等待游戏页面支持新格式地图渲染

### 清除旧数据
如果之前保存了包含错误路径的地图，需要先清除：

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 运行：
```sql
DELETE FROM "SharedMap";
```

## 故障排除

### 问题1：地图编辑器页面404
- 等待Vercel和Railway部署完成
- 清除浏览器缓存
- 检查Railway后端是否正常运行

### 问题2：保存地图失败
- 检查浏览器控制台的错误信息
- 确认已登录（有token）
- 检查Railway后端日志

### 问题3：游戏不显示新地图
- 目前游戏页面还不支持新格式地图
- 会自动回退到默认地图
- 需要等待游戏页面更新

## 下一步计划

1. ✅ 添加云端地图编辑器页面
2. ✅ 修复资源路径问题
3. ⏳ 更新游戏页面支持新格式地图渲染
4. ⏳ 添加地图预览功能
5. ⏳ 支持多人协作编辑

## 技术细节

### 前端配置
- 新增页面：`frontend/src/app/map-editor/page.tsx`
- 代理配置：`frontend/next.config.js`
- 路由：`/map-editor` → `/editor-runtime/map-editor` → Railway后端

### 后端配置
- 路由：`backend/src/index.ts` - `/tools/map-editor`
- HTML文件：`backend/map-editor.html`
- API路由：`backend/src/routes/mapEditor.ts`

### 数据库
- 表：`SharedMap`
- 字段：`id`, `name`, `mapData`, `isActive`, `createdBy`, `createdAt`, `updatedAt`
