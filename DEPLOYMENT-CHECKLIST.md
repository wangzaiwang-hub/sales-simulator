# 部署检查清单

在部署到生产环境之前，请确保完成以下所有检查项。

## 准备阶段

- [ ] 代码已推送到 GitHub
- [ ] 已创建 Supabase 项目
- [ ] 已运行所有数据库迁移脚本
- [ ] 已创建 SecondMe OAuth 应用
- [ ] 已安装 Railway CLI（可选）
- [ ] 已安装 Vercel CLI（可选）

## 后端配置

- [ ] 复制 `backend/.env.example` 为 `backend/.env`
- [ ] 配置 `PORT=3001`
- [ ] 配置 `NODE_ENV=production`
- [ ] 配置 `SUPABASE_URL`（从 Supabase 控制台获取）
- [ ] 配置 `SUPABASE_SERVICE_KEY`（从 Supabase 控制台获取）
- [ ] 配置 `DATABASE_URL`（从 Supabase 控制台获取）
- [ ] 配置 `JWT_SECRET`（生成随机字符串，至少32位）
- [ ] 配置 `SECONDME_CLIENT_ID`
- [ ] 配置 `SECONDME_CLIENT_SECRET`
- [ ] 本地测试后端：`cd backend && npm run dev`

## 前端配置

- [ ] 创建 `frontend/.env.production`
- [ ] 配置 `NEXT_PUBLIC_SECONDME_CLIENT_ID`
- [ ] 本地测试前端：`cd frontend && npm run dev`

## Railway 部署

- [ ] 创建 Railway 项目
- [ ] 连接 GitHub 仓库
- [ ] 设置 Root Directory 为 `backend`
- [ ] 添加所有环境变量
- [ ] 触发部署
- [ ] 等待部署完成
- [ ] 复制 Railway 域名
- [ ] 测试健康检查：`https://your-backend.railway.app/health`

## Vercel 部署

- [ ] 创建 Vercel 项目
- [ ] 连接 GitHub 仓库
- [ ] 设置 Root Directory 为 `frontend`
- [ ] 添加所有环境变量
- [ ] 触发部署
- [ ] 等待部署完成
- [ ] 复制 Vercel 域名
- [ ] 测试前端访问：`https://your-frontend.vercel.app`

## 环境变量更新

- [ ] 更新 Railway 的 `BASE_URL` 为 Railway 域名
- [ ] 更新 Railway 的 `FRONTEND_URL` 为 Vercel 域名
- [ ] 更新 Railway 的 `CORS_ORIGIN` 为 Vercel 域名
- [ ] 更新 Railway 的 `SECONDME_REDIRECT_URI` 为 Vercel 域名 + `/auth/callback`
- [ ] 更新 Vercel 的 `NEXT_PUBLIC_API_URL` 为 Railway 域名
- [ ] 更新 Vercel 的 `BACKEND_URL` 为 Railway 域名
- [ ] 更新 Vercel 的 `NEXT_PUBLIC_SECONDME_REDIRECT_URI` 为 Vercel 域名 + `/auth/callback`
- [ ] 在 Railway 触发重新部署
- [ ] 在 Vercel 触发重新部署

## SecondMe OAuth 配置

- [ ] 登录 SecondMe 开发者控制台
- [ ] 找到你的 OAuth 应用
- [ ] 添加回调地址：`https://your-frontend.vercel.app/auth/callback`
- [ ] 保存配置

## 功能测试

- [ ] 访问前端首页
- [ ] 测试用户注册
- [ ] 测试用户登录
- [ ] 测试 SecondMe OAuth 登录
- [ ] 测试角色创建
- [ ] 测试进入游戏
- [ ] 测试角色移动
- [ ] 测试与 NPC 对话
- [ ] 测试聊天历史加载
- [ ] 测试关系系统
- [ ] 测试地图编辑器
- [ ] 测试地图保存到云端
- [ ] 测试地图从云端加载
- [ ] 测试设置激活地图
- [ ] 测试游戏加载新地图

## 性能测试

- [ ] 检查首页加载时间（< 3秒）
- [ ] 检查游戏加载时间（< 5秒）
- [ ] 检查 API 响应时间（< 500ms）
- [ ] 检查图片加载速度
- [ ] 检查移动端体验

## 安全检查

- [ ] 确认 `.env` 文件未提交到 Git
- [ ] 确认 JWT_SECRET 是随机生成的
- [ ] 确认 Supabase 服务密钥未泄露
- [ ] 确认 SecondMe 客户端密钥未泄露
- [ ] 检查 CORS 配置是否正确
- [ ] 检查 API 端点是否需要认证
- [ ] 运行 `npm audit` 检查依赖漏洞

## 监控配置

- [ ] 配置 Railway 告警
- [ ] 配置 Vercel 告警
- [ ] 配置 Supabase 告警
- [ ] 设置错误日志收集
- [ ] 设置性能监控

## 备份配置

- [ ] 确认 Supabase 自动备份已启用
- [ ] 导出当前数据库结构
- [ ] 备份环境变量配置
- [ ] 备份 SecondMe OAuth 配置

## 文档更新

- [ ] 更新 README.md 中的部署信息
- [ ] 记录生产环境域名
- [ ] 记录环境变量配置
- [ ] 更新 API 文档（如有）

## 上线准备

- [ ] 通知团队成员
- [ ] 准备回滚方案
- [ ] 准备紧急联系方式
- [ ] 设置维护页面（可选）

## 上线后验证

- [ ] 再次测试所有核心功能
- [ ] 检查错误日志
- [ ] 检查性能指标
- [ ] 收集用户反馈
- [ ] 监控服务器资源使用

## 优化建议

- [ ] 配置自定义域名
- [ ] 启用 CDN 加速
- [ ] 优化图片资源
- [ ] 配置数据库索引
- [ ] 实施缓存策略
- [ ] 配置负载均衡（如需要）

---

## 完成标记

- 部署日期：__________
- 部署人员：__________
- 前端域名：__________
- 后端域名：__________
- 数据库版本：__________
- 备注：__________

---

## 紧急联系

- Railway 支持：https://railway.app/help
- Vercel 支持：https://vercel.com/support
- Supabase 支持：https://supabase.com/support
- SecondMe 支持：__________
