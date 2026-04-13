# 局域网访问配置指南

## 快速开始

### 1. 安装nginx（如果还没安装）

```bash
brew install nginx
```

### 2. 启动局域网服务

```bash
./start-lan.sh
```

脚本会自动：
- 检测你的局域网IP地址
- 更新前后端环境变量
- 启动nginx反向代理
- 显示访问地址和配置信息

### 3. 配置SecondMe回调地址

在SecondMe平台添加回调地址（脚本会显示具体地址）：
```
http://你的局域网IP/auth/callback
```

例如：`http://192.168.1.100/auth/callback`

### 4. 访问游戏

在局域网内的任何设备上打开浏览器，访问：
```
http://你的局域网IP
```

## 停止局域网服务

```bash
./stop-lan.sh
```

或者手动停止nginx：
```bash
sudo nginx -s stop
```

## 架构说明

```
局域网设备 (http://192.168.1.100)
    ↓
Nginx反向代理 (端口80)
    ↓
    ├─→ 前端 Next.js (localhost:3000)
    └─→ 后端 API (localhost:3001)
```

## 工作原理

1. **Nginx监听80端口**：接收来自局域网的所有请求
2. **前端请求**：`/` 路径代理到 `localhost:3000`
3. **API请求**：`/api/` 路径代理到 `localhost:3001`
4. **OAuth回调**：SecondMe回调到你的局域网IP，nginx转发到前端处理

## 常见问题

### Q: 端口80被占用怎么办？

A: 脚本会自动尝试停止nginx。如果还是不行，检查是否有其他服务占用80端口：
```bash
sudo lsof -i :80
```

### Q: 其他设备无法访问？

A: 检查：
1. 设备是否在同一局域网
2. Mac防火墙是否阻止了80端口
3. 路由器是否有设备隔离功能

### Q: SecondMe登录失败？

A: 确保：
1. 在SecondMe平台添加了正确的回调地址
2. 回调地址格式：`http://你的IP/auth/callback`（不是localhost）

### Q: 如何查看nginx日志？

```bash
# 访问日志
tail -f /usr/local/var/log/nginx/access.log

# 错误日志
tail -f /usr/local/var/log/nginx/error.log
```

### Q: 如何重新加载nginx配置？

```bash
sudo nginx -s reload
```

## 手动配置（高级）

如果不想使用脚本，可以手动配置：

### 1. 获取本机IP
```bash
ipconfig getifaddr en0
```

### 2. 更新环境变量

**frontend/.env.local**:
```env
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://你的IP/auth/callback
NEXT_PUBLIC_API_URL=http://你的IP
```

**backend/.env**:
```env
BASE_URL=http://你的IP
FRONTEND_URL=http://你的IP
SECONDME_REDIRECT_URI=http://你的IP/auth/callback
CORS_ORIGIN=http://你的IP
```

### 3. 启动nginx
```bash
sudo nginx -c $(pwd)/nginx.conf
```

## 安全提示

⚠️ 此配置仅用于局域网内部测试，不要暴露到公网！

- nginx配置接受所有IP访问（`server_name _`）
- 没有HTTPS加密
- 没有访问控制
- 仅适合开发和局域网游戏

## 恢复本地开发

运行停止脚本会自动恢复localhost配置：
```bash
./stop-lan.sh
```

然后重启前后端服务即可。
