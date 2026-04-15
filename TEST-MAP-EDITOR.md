# 测试地图编辑器访问

## 问题诊断

地图编辑器页面显示 404 错误。让我们逐步测试每个环节。

## 测试步骤

### 1. 测试 Railway 后端是否部署成功

直接访问后端的地图编辑器：
```
https://capable-energy-production-bf2e.up.railway.app/tools/map-editor
```

**预期结果：**
- 应该看到地图编辑器的HTML页面
- 如果看到404，说明Railway部署有问题

### 2. 测试前端代理是否工作

访问前端的代理路径：
```
https://sales-simulator-zeta.vercel.app/editor-runtime/map-editor
```

**预期结果：**
- 应该看到地图编辑器的HTML页面
- 如果看到404，说明前端的rewrite配置有问题

### 3. 测试完整的地图编辑器页面

访问：
```
https://sales-simulator-zeta.vercel.app/map-editor
```

**预期结果：**
- 应该看到带导航栏的地图编辑器页面
- iframe中应该加载编辑器内容

## 可能的问题和解决方案

### 问题1：Railway 后端404
**原因：** Railway 还没有部署最新代码

**解决方法：**
1. 访问 https://railway.app/dashboard
2. 找到你的项目
3. 查看最新的部署状态
4. 如果部署失败，查看日志
5. 如果需要，手动触发重新部署

### 问题2：前端代理404
**原因：** Vercel 的 rewrite 配置没有生效

**解决方法：**
1. 访问 https://vercel.com/dashboard
2. 找到你的项目
3. 进入 Settings → Environment Variables
4. 确认 `BACKEND_URL` 设置为：
   ```
   https://capable-energy-production-bf2e.up.railway.app
   ```
5. 重新部署（Deployments → Redeploy）

### 问题3：iframe 加载失败
**原因：** 浏览器安全策略阻止了iframe

**解决方法：**
- 检查浏览器控制台是否有 CORS 或 X-Frame-Options 错误
- 如果有，需要在后端添加相应的响应头

## 临时解决方案

如果云端地图编辑器暂时无法使用，可以使用本地版本：

1. 启动本地后端：
   ```bash
   cd backend
   npm run dev
   ```

2. 在浏览器中打开：
   ```
   http://localhost:3001/tools/map-editor
   ```

3. 编辑完成后，可以：
   - 导出JSON
   - 手动上传到数据库
   - 或者通过API保存

## 检查清单

- [ ] Railway 后端部署成功
- [ ] 可以直接访问后端的 /tools/map-editor
- [ ] Vercel 前端部署成功
- [ ] 前端的 BACKEND_URL 环境变量正确
- [ ] 可以通过前端代理访问 /editor-runtime/map-editor
- [ ] 地图编辑器页面的 iframe 正常加载

## 下一步

请按照上面的测试步骤，告诉我：
1. 哪个测试失败了？
2. 具体的错误信息是什么？

这样我就能准确定位问题并修复。
