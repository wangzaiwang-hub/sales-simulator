# 缓存问题说明

## 为什么会出现缓存问题？

### 主要原因

1. **Next.js 15 较新版本**
   - Next.js 15是较新的版本，可能存在一些稳定性问题
   - 热重载（Fast Refresh）有时会失败

2. **文件路径包含中文**
   - 项目路径：`/Users/wangzaiwng/Desktop/销售模拟器`
   - 某些工具对中文路径支持不完善

3. **tsx watch模式**
   - 后端使用`tsx watch`监听文件变化
   - 频繁修改可能导致编译缓存不一致

4. **开发环境的正常现象**
   - 开发时频繁修改代码
   - 有时缓存更新不及时

## 何时需要清理缓存？

### 必须清理的情况

- ❌ 出现 `Cannot find module` 错误
- ❌ 修改代码后页面没有更新
- ❌ 出现奇怪的编译错误
- ❌ 页面显示500错误但代码没问题

### 不需要清理的情况

- ✅ 代码正常运行
- ✅ 热重载正常工作
- ✅ 只是修改了一些代码

## 如何减少缓存问题？

### 1. 优化Next.js配置

已在 `frontend/next.config.js` 中添加：
```javascript
// 文件系统缓存
config.cache = {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
};
```

### 2. 使用清理脚本

只在遇到问题时运行：
```bash
./clean-cache.sh
```

### 3. 正常开发流程

大多数情况下，只需要：
```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

热重载会自动处理代码变化。

### 4. 避免频繁重启

- 修改代码后等待热重载完成
- 不要频繁停止/启动服务
- 让开发服务器持续运行

## 长期解决方案

### 选项1：降级Next.js（如果问题持续）

```bash
cd frontend
npm install next@14.2.0
```

### 选项2：移动项目到英文路径

将项目移到不含中文的路径：
```bash
mv ~/Desktop/销售模拟器 ~/Desktop/sales-simulator
```

### 选项3：使用更稳定的工具

后端可以考虑使用 `nodemon` 替代 `tsx watch`：
```bash
npm install -D nodemon
```

修改 `package.json`:
```json
"dev": "nodemon --exec tsx src/index.ts"
```

## 监控缓存健康

### 检查前端状态
```bash
# 查看.next目录大小
du -sh frontend/.next

# 如果超过500MB，考虑清理
```

### 检查后端状态
```bash
# 查看dist目录
ls -la backend/dist

# 确保文件是最新的
```

## 最佳实践

1. **每天开始工作前**：正常启动，不清理缓存
2. **遇到问题时**：先重启服务，不行再清理缓存
3. **大改动后**：可以主动清理一次缓存
4. **部署前**：清理缓存并完整构建

## 快速诊断

遇到问题时按顺序尝试：

1. **刷新浏览器** (Cmd+Shift+R)
2. **重启前端服务**
3. **重启后端服务**
4. **清理缓存** (`./clean-cache.sh`)
5. **检查代码错误**

---

**记住**：缓存问题不应该频繁出现。如果经常需要清理，说明有更深层的问题需要解决。
