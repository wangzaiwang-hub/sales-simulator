# Vercel + Railway 部署说明

当前项目推荐部署方式：

- 前端：Vercel
- 后端：Railway
- 数据：Supabase

## 现状

- `frontend` 已通过 `next.config.js` 把 `/api/*` 与 `/resource/*` 重写到 `BACKEND_URL`
- `backend` 在构建时会自动复制 `resource/` 与工具页文件，因此可以单独部署 `backend` 目录

## 1. 部署后端到 Railway

推荐把 `backend` 作为独立服务部署。

如果你用 CLI，可以在仓库根目录执行：

```bash
railway up backend --path-as-root
```

如果你用 Railway 面板导入仓库：

1. 新建服务
2. 把 Root Directory 设为 `/backend`
3. 保持默认 Node 构建流程即可，项目会执行 `npm run build`

后端至少需要这些变量：

```env
NODE_ENV=production
BASE_URL=https://your-backend.up.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
DATABASE_URL=...
JWT_SECRET=...
SECONDME_CLIENT_ID=...
SECONDME_CLIENT_SECRET=...
SECONDME_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback
```

部署完成后，先确认：

- `https://your-backend.up.railway.app/health`
- `https://your-backend.up.railway.app/resource/shouye.gif`

都能正常返回。

## 2. 部署前端到 Vercel

把 `frontend` 导入为独立项目，Root Directory 设为 `frontend`。

前端需要这些变量：

```env
BACKEND_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_SECONDME_CLIENT_ID=...
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback
```

说明：

- `BACKEND_URL` 用于 Next rewrites，把 `/api/*` 和 `/resource/*` 转发到 Railway
- 当前代码里请求默认走同域路径，所以 `NEXT_PUBLIC_API_URL` 可以留空

## 3. SecondMe 回调地址

在 SecondMe 开发者平台里，把 OAuth 回调地址改成：

```text
https://your-frontend.vercel.app/auth/callback
```

前后端的 `SECONDME_REDIRECT_URI` / `NEXT_PUBLIC_SECONDME_REDIRECT_URI` 都要与这里保持一致。

## 4. 推荐上线顺序

1. 先创建 Railway 后端服务，拿到后端域名
2. 再创建 Vercel 前端项目，填入 `BACKEND_URL`
3. 拿到 Vercel 正式域名后，回填 Railway 的 `FRONTEND_URL`、`CORS_ORIGIN`、`SECONDME_REDIRECT_URI`
4. 再回填 Vercel 的 `NEXT_PUBLIC_SECONDME_REDIRECT_URI`
5. 最后到 SecondMe 平台更新 OAuth 回调地址并重新部署一次前后端

## 5. 平台文档

- Vercel CLI 部署：[Deploying a project from the CLI](https://vercel.com/docs/projects/deploy-from-cli)
- Vercel 环境变量：[Environment variables](https://vercel.com/docs/environment-variables)
- Railway Monorepo：[Deploying a Monorepo](https://docs.railway.com/guides/monorepo)
- Railway CLI 上传部署：[Deploying with the CLI](https://docs.railway.com/cli/deploying)
- Railway 变量配置：[Using Variables](https://docs.railway.com/develop/variables)
