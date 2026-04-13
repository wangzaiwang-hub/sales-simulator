# 安装指南

## 安装nginx

### macOS (使用Homebrew)

```bash
# 如果还没安装Homebrew，先安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装nginx
brew install nginx
```

### 验证安装

```bash
nginx -v
```

应该显示类似：`nginx version: nginx/1.25.x`

## 完整启动流程

### 1. 确保前后端服务正在运行

**终端1 - 后端**:
```bash
cd backend
npm install  # 首次运行
npm run dev
```

**终端2 - 前端**:
```bash
cd frontend
npm install  # 首次运行
npm run dev
```

### 2. 启动nginx反向代理

**终端3 - nginx**:
```bash
./start-lan.sh
```

### 3. 配置SecondMe

访问SecondMe平台，添加回调地址（脚本会显示）

### 4. 开始游戏

在局域网设备上访问显示的IP地址

## 目录结构

```
销售模拟器/
├── backend/              # 后端服务 (端口3001)
├── frontend/             # 前端服务 (端口3000)
├── nginx.conf            # nginx配置文件
├── start-lan.sh          # 启动脚本
├── stop-lan.sh           # 停止脚本
├── LAN-SETUP.md          # 详细文档
└── QUICK-START-LAN.md    # 快速开始
```

## 端口使用

- **80**: nginx反向代理（需要sudo权限）
- **3000**: Next.js前端开发服务器
- **3001**: Express后端API服务器

## 故障排除

### nginx启动失败

1. 检查端口80是否被占用：
```bash
sudo lsof -i :80
```

2. 如果有其他服务占用，停止它：
```bash
sudo nginx -s stop
# 或
sudo killall nginx
```

### 前后端服务未启动

确保在启动nginx之前，前后端服务都在运行：
```bash
# 检查3000端口
lsof -i :3000

# 检查3001端口
lsof -i :3001
```

### 权限问题

nginx需要sudo权限来监听80端口。如果不想使用sudo，可以：

1. 修改nginx.conf，改用8080端口
2. 访问时使用 `http://IP:8080`

## 下一步

安装完成后，查看 [QUICK-START-LAN.md](./QUICK-START-LAN.md) 开始使用。
