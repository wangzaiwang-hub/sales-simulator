# 🔧 Vercel 环境变量配置指南

## 问题诊断

如果游戏页面还是黑屏，很可能是 Vercel 的环境变量没有正确配置。

## 立即检查

### 方法 1：访问调试页面（推荐）

等待 Vercel 部署完成后，访问：
```
https://sales-simulator-zeta.vercel.app/debug-env
```

这个页面会显示当前的环境变量配置。

### 方法 2：检查浏览器控制台

1. 打开游戏页面
2. 按 F12 打开开发者工具
3. 在 Console 中输入：
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

如果显示 `undefined`，说明环境变量没有配置。

## 配置 Vercel 环境变量

### 步骤 1：登录 Vercel

访问：https://vercel.com/dashboard

### 步骤 2：进入项目设置

1. 找到你的项目：`sales-simulator`
2. 点击项目名称
3. 点击顶部的 "Settings" 标签

### 步骤 3：配置环境变量

1. 在左侧菜单中点击 "Environment Variables"
2. 添加以下变量：

#### 必需的环境变量

| 变量名 | 值 | 环境 |
|--------|-----|------|
| NEXT_PUBLIC_API_URL | https://你的后端域名.railway.app | Production, Preview, Development |
| NEXT_PUBLIC_SECONDME_CLIENT_ID | 3fd385c8-95d8-4ec9-a547-16e104da067f | Production, Preview, Development |
| NEXT_PUBLIC_SECONDME_REDIRECT_URI | https://sales-simulator-zeta.vercel.app/auth/callback | Production |
| BACKEND_URL | https://你的后端域名.railway.app | Production, Preview, Development |

#### 添加方法

对于每个变量：
1. 在 "Key" 输入框中输入变量名（例如：`NEXT_PUBLIC_API_URL`）
2. 在 "Value" 输入框中输入变量值
3. 选择环境：勾选 "Production"、"Preview" 和 "Development"
4. 点击 "Save"

### 步骤 4：重新部署

环境变量添加完成后：
1. 点击顶部的 "Deployments" 标签
2. 找到最新的部署
3. 点击右侧的 "..." 菜单
4. 选择 "Redeploy"
5. 确认重新部署

## 获取 Railway 后端域名

如果你不知道后端域名：

1. 访问：https://railway.app/dashboard
2. 进入你的项目
3. 点击 "Settings" 标签
4. 在 "Domains" 部分查看域名
5. 复制完整的 HTTPS 域名（例如：`https://sales-simulator-production.up.railway.app`）

## 验证配置

### 1. 等待部署完成

重新部署需要 2-3 分钟。

### 2. 访问调试页面

```
https://sales-simulator-zeta.vercel.app/debug-env
```

应该看到：
- ✅ NEXT_PUBLIC_API_URL: https://你的后端域名.railway.app
- ✅ NEXT_PUBLIC_SECONDME_CLIENT_ID: 3fd385c8-...
- ✅ NEXT_PUBLIC_SECONDME_REDIRECT_URI: https://sales-simulator-zeta.vercel.app/auth/callback

### 3. 测试游戏

访问：
```
https://sales-simulator-zeta.vercel.app/game
```

应该能看到完整的游戏画面。

## 常见问题

### Q: 环境变量添加后还是不生效？

A: 必须重新部署才能生效。环境变量在构建时注入，不会自动更新。

### Q: 应该选择哪些环境？

A: 
- Production：生产环境（必选）
- Preview：预览环境（推荐）
- Development：开发环境（可选）

### Q: NEXT_PUBLIC_ 前缀是什么？

A: Next.js 要求在客户端使用的环境变量必须以 `NEXT_PUBLIC_` 开头。

### Q: 为什么有些变量没有 NEXT_PUBLIC_ 前缀？

A: `BACKEND_URL` 只在服务端使用，不需要这个前缀。

## 完整的环境变量列表

复制以下内容，替换域名后使用：

```bash
# 客户端环境变量（必须以 NEXT_PUBLIC_ 开头）
NEXT_PUBLIC_API_URL=https://你的后端域名.railway.app
NEXT_PUBLIC_SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://sales-simulator-zeta.vercel.app/auth/callback

# 服务端环境变量
BACKEND_URL=https://你的后端域名.railway.app
```

## 检查清单

- [ ] 登录 Vercel
- [ ] 进入项目设置
- [ ] 添加 NEXT_PUBLIC_API_URL
- [ ] 添加 NEXT_PUBLIC_SECONDME_CLIENT_ID
- [ ] 添加 NEXT_PUBLIC_SECONDME_REDIRECT_URI
- [ ] 添加 BACKEND_URL
- [ ] 选择所有环境（Production, Preview, Development）
- [ ] 保存所有变量
- [ ] 重新部署
- [ ] 等待部署完成
- [ ] 访问调试页面验证
- [ ] 测试游戏功能

## 完成！

配置完成后，游戏应该能正常显示了。
