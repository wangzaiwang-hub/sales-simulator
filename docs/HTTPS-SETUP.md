# HTTPS 反代配置说明

## 问题说明

做了反代之后访问不了的原因：
1. 前端环境变量还在使用 `http://localhost:3000`
2. 后端CORS配置还在使用 `http://localhost:3000`
3. SecondMe OAuth回调地址需要更新为HTTPS地址
4. `tileset-editor.html` 中硬编码了后端地址

## 已修复的配置

### 1. 前端环境变量 (`frontend/.env.local`)
```env
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://192.168.110.169:3443/auth/callback
NEXT_PUBLIC_API_URL=https://192.168.110.169:3443
BACKEND_URL=http://localhost:3001
```

### 2. 后端环境变量 (`backend/.env`)
```env
FRONTEND_URL=https://192.168.110.169:3443
SECONDME_REDIRECT_URI=https://192.168.110.169:3443/auth/callback
CORS_ORIGIN=https://192.168.110.169:3443
```

### 3. tileset-editor.html
- API地址输入框默认为空，自动使用当前域名
- 通过Next.js的rewrites功能代理到后端

## 启动步骤

### 1. 启动后端服务
```bash
cd backend
npm run dev
```
后端会在 `http://localhost:3001` 运行

### 2. 启动前端服务
```bash
cd frontend
npm run dev
```
前端会在 `http://localhost:3000` 运行

### 3. 启动HTTPS反代
```bash
cd frontend
npm run https-proxy
```
HTTPS反代会在 `https://192.168.110.169:3443` 运行

## 访问地址

- 本地访问：`https://127.0.0.1:3443`
- 局域网访问：`https://192.168.110.169:3443`
- 手机访问：`https://192.168.110.169:3443`（需在同一局域网）

## 工作原理

```
浏览器 (HTTPS)
    ↓
https://192.168.110.169:3443 (HTTPS反代)
    ↓
http://localhost:3000 (Next.js前端)
    ↓ (通过rewrites代理)
http://localhost:3001 (Express后端)
```

## 注意事项

1. **证书信任**：首次访问会提示证书不安全，需要在浏览器中信任证书
2. **防火墙**：确保防火墙允许3443端口访问
3. **同一局域网**：手机访问需要在同一局域网内
4. **SecondMe配置**：需要在SecondMe平台更新回调地址为 `https://192.168.110.169:3443/auth/callback`

## 共享地图功能

### 数据库迁移

在Supabase Dashboard → SQL Editor 中运行：
```bash
backend/migrations/add-shared-map.sql
```

### 功能说明

1. **共享地图**：所有用户看到同一张地图
2. **个人地图**：每个用户有自己的地图（回退方案）

### API变化

- `GET /api/game/map`：返回共享地图（如果存在），否则返回个人地图
  - 响应增加 `isShared` 字段表示是否为共享地图
- `POST /api/game/map`：保存地图
  - `saveAsShared: false`：保存为个人地图
  - `saveAsShared: true`：保存为共享地图（所有用户可见）

### 前端调用示例

```typescript
// 保存为共享地图
await fetch('/api/game/map', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    map: mapData,
    saveAsShared: true  // 设为true保存为共享地图
  })
});
```

### tileset-editor.html 使用说明

1. 在编辑器中，API地址输入框留空即可
2. 会自动使用当前域名（通过Next.js rewrites代理）
3. 登录后token会自动从localStorage读取

## 故障排查

### 1. 无法访问HTTPS地址
- 检查HTTPS反代是否启动：`npm run https-proxy`
- 检查证书文件是否存在：`frontend/certs/local-ip.crt` 和 `local-ip.key`
- 检查端口3443是否被占用：`lsof -i :3443`

### 2. CORS错误
- 确认 `backend/.env` 中的 `CORS_ORIGIN` 设置为 `https://192.168.110.169:3443`
- 重启后端服务
- 清除浏览器缓存

### 3. OAuth回调失败
- 确认SecondMe平台的回调地址已更新为 `https://192.168.110.169:3443/auth/callback`
- 检查 `frontend/.env.local` 和 `backend/.env` 中的回调地址一致
- 检查浏览器控制台是否有错误信息

### 4. 地图不共享
- 确认已运行数据库迁移脚本
- 检查 `SharedMap` 表是否创建成功：在Supabase中查询 `SELECT * FROM "SharedMap"`
- 确认保存地图时 `saveAsShared` 参数设置正确
- 检查后端日志是否有错误

### 5. 资源加载失败
- 检查 `resource` 文件夹是否存在
- 确认后端静态资源路由配置正确
- 检查浏览器控制台的网络请求

### 6. 前端页面空白
- 检查浏览器控制台是否有JavaScript错误
- 确认Next.js服务正常运行
- 尝试清除浏览器缓存并刷新
- 检查 `frontend/next.config.js` 中的rewrites配置

## 开发模式 vs 生产模式

### 开发模式（当前配置）
- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`
- HTTPS反代：`https://192.168.110.169:3443`

### 本地开发（不使用HTTPS）
如果只在本地开发，可以使用：
```env
# frontend/.env.local
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback

# backend/.env
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback
```

然后直接访问 `http://localhost:3000`，不需要启动HTTPS反代。
