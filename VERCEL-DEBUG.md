# Vercel 部署调试指南

## 当前问题
前端显示 "Application error: a client-side exception has occurred"

## 可能的原因

### 1. 构建缓存问题
Vercel 可能使用了旧的构建缓存

**解决方法：**
1. 登录 Vercel Dashboard
2. 进入项目设置
3. 点击 "Deployments"
4. 找到最新的部署
5. 点击 "Redeploy" 并选择 "Clear cache and redeploy"

### 2. 环境变量未设置
`BACKEND_URL` 环境变量可能未在 Vercel 中配置

**解决方法：**
1. 登录 Vercel Dashboard
2. 进入项目设置
3. 点击 "Environment Variables"
4. 添加：
   - Name: `BACKEND_URL`
   - Value: `https://capable-energy-production-bf2e.up.railway.app`
   - Environment: Production

### 3. 页面代码问题
某个页面可能有运行时错误

**解决方法：**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 找到具体的错误信息
4. 将错误信息告诉我

## 已完成的修复

1. ✅ 简化了 map-editor 页面，移除了可能导致问题的认证检查
2. ✅ 添加了 vercel.json 配置文件
3. ✅ 修复了 map-editor.html 中的资源路径
4. ✅ 代码已推送到 GitHub

## 验证步骤

### 1. 检查 Vercel 部署状态
访问：https://vercel.com/dashboard
- 查看最新部署是否成功
- 查看构建日志是否有错误

### 2. 检查具体错误
访问：https://sales-simulator-zeta.vercel.app/game
- 打开浏览器控制台（F12）
- 查看 Console 中的错误信息
- 查看 Network 中是否有失败的请求

### 3. 测试其他页面
- https://sales-simulator-zeta.vercel.app/ （首页）
- https://sales-simulator-zeta.vercel.app/auth/login （登录页）
- https://sales-simulator-zeta.vercel.app/character-creator （角色创建）

如果其他页面正常，说明只是 game 或 map-editor 页面的问题。

## 临时解决方案

如果问题持续，可以：

1. **回滚到之前的版本**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **使用本地开发环境**
   ```bash
   cd frontend
   npm run dev
   ```
   然后访问 http://localhost:3000

## 需要的信息

如果问题仍然存在，请提供：
1. 浏览器控制台的完整错误信息
2. Vercel 部署日志的截图
3. 哪个页面出现错误（首页、游戏页、地图编辑器等）
