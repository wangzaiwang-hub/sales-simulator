# Vercel + Railway 重新部署说明

目标是只保留一条部署链路：

- 前端：Vercel，Root Directory 固定为 `frontend`
- 后端：Railway，服务源码根固定为 `backend`
- 数据：Supabase

不要混用“整个仓库根目录部署”和“backend 子目录部署”两种方式。选一种并坚持到底，否则最容易出现域名没错但接口不对的情况。

## 1. 推荐的清空重建方案

### Railway 后端

最稳的做法是新建一个 Railway 服务，只部署 `backend`。

如果通过 Railway 面板从 GitHub 导入：

1. 新建服务
2. 连接当前仓库
3. 把服务的源码根设成 `backend`
4. `Root Directory` 留空
5. `Build Command` 设为 `npm run build`
6. `Start Command` 设为 `npm start`
7. Node 版本设成 `20`

如果 Railway 当前看到的源码根已经是 `backend`，就不要再填 `backend`，否则会变成找 `backend/backend`。

如果你用 CLI，可以直接从仓库根目录执行：

```bash
railway up backend --path-as-root
```

### Vercel 前端

新建一个 Vercel 项目，只部署 `frontend`。

1. 导入当前仓库
2. `Root Directory` 设为 `frontend`
3. 保持默认 Next.js 配置
4. 环境变量里填 `BACKEND_URL`

## 2. Railway 后端必填变量

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

## 3. Vercel 前端必填变量

```env
BACKEND_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_SECONDME_CLIENT_ID=...
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback
```

说明：

- `BACKEND_URL` 用于 Next rewrites，把 `/api/*` 统一转发到 Railway
- 当前代码里请求默认走同域路径，所以 `NEXT_PUBLIC_API_URL` 可以留空

## 4. 部署后验收

后端部署完成后，先直接打开：

- `https://your-backend.up.railway.app/health`
- `https://your-backend.up.railway.app/api/map-editor/list`
- `https://your-backend.up.railway.app/tools/map-editor`

这三个必须都通，再去部署前端。

前端部署完成后，再检查：

- `https://your-frontend.vercel.app/editor`
- `https://your-frontend.vercel.app/api/map-editor/list`

## 5. 推荐上线顺序

1. 删除旧的 Railway 服务，重新建一个只跑 `backend` 的服务
2. 确认 Railway 的 `/health`、`/api/map-editor/list`、`/tools/map-editor` 正常
3. 删除旧的 Vercel 项目，重新建一个只跑 `frontend` 的项目
4. 在 Vercel 填入新的 `BACKEND_URL`
5. 再回填 Railway 的 `FRONTEND_URL`、`CORS_ORIGIN`、`SECONDME_REDIRECT_URI`
6. 最后更新 SecondMe 平台里的 OAuth 回调地址

## 6. 平台文档

- Vercel CLI 部署：[Deploying a project from the CLI](https://vercel.com/docs/projects/deploy-from-cli)
- Vercel 环境变量：[Environment variables](https://vercel.com/docs/environment-variables)
- Railway Monorepo：[Deploying a Monorepo](https://docs.railway.com/guides/monorepo)
- Railway CLI 上传部署：[Deploying with the CLI](https://docs.railway.com/cli/deploying)
- Railway 变量配置：[Using Variables](https://docs.railway.com/develop/variables)
