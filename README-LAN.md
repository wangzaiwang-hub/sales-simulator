# 🎮 销售模拟器 - 局域网多人游戏指南

## 两种方案

### 方案1：使用80端口（推荐，需要sudo）

**优点**：访问地址简洁，不需要端口号
**缺点**：需要sudo权限

```bash
./start-lan.sh
```

访问地址：`http://192.168.110.169`

### 方案2：使用8080端口（无需sudo）

**优点**：不需要sudo权限
**缺点**：访问地址需要加端口号

```bash
./start-lan-8080.sh
```

访问地址：`http://192.168.110.169:8080`

## 前置条件

### 1. 安装nginx

```bash
brew install nginx
```

### 2. 确保前后端服务运行

**终端1 - 后端**:
```bash
cd backend
npm run dev
```

**终端2 - 前端**:
```bash
cd frontend
npm run dev
```

## 快速开始

### 步骤1：选择并运行启动脚本

```bash
# 方案1（推荐）
./start-lan.sh

# 或方案2（无需sudo）
./start-lan-8080.sh
```

### 步骤2：配置SecondMe

脚本会显示需要添加的回调地址，例如：
- 方案1：`http://192.168.110.169/auth/callback`
- 方案2：`http://192.168.110.169:8080/auth/callback`

去SecondMe平台添加这个回调地址。

### 步骤3：开始游戏

在局域网内的任何设备上访问显示的地址：
- 方案1：`http://192.168.110.169`
- 方案2：`http://192.168.110.169:8080`

## 停止服务

### 方案1（80端口）
```bash
./stop-lan.sh
```

### 方案2（8080端口）
```bash
nginx -s stop
./stop-lan.sh  # 恢复localhost配置
```

## 架构说明

```
局域网设备
    ↓
Nginx反向代理 (80或8080端口)
    ↓
    ├─→ 前端 Next.js (localhost:3000)
    └─→ 后端 API (localhost:3001)
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `start-lan.sh` | 启动脚本（80端口，需要sudo） |
| `start-lan-8080.sh` | 启动脚本（8080端口，无需sudo） |
| `stop-lan.sh` | 停止脚本，恢复localhost配置 |
| `nginx.conf` | nginx配置（80端口） |
| `nginx-8080.conf` | nginx配置（8080端口） |
| `LAN-SETUP.md` | 详细配置文档 |
| `INSTALL.md` | 安装指南 |

## 常见问题

### Q: 我应该选择哪个方案？

A: 如果你不介意输入sudo密码，选择方案1（80端口），访问地址更简洁。否则选择方案2（8080端口）。

### Q: 其他设备无法访问？

A: 检查：
1. 设备是否在同一局域网（连接同一个WiFi）
2. Mac防火墙设置（系统偏好设置 → 安全性与隐私 → 防火墙）
3. 前后端服务是否正在运行

### Q: SecondMe登录失败？

A: 确保：
1. 在SecondMe平台添加了正确的回调地址
2. 回调地址与脚本显示的完全一致（包括端口号）
3. 使用的是局域网IP，不是localhost

### Q: 如何查看我的局域网IP？

```bash
ipconfig getifaddr en0
```

当前检测到的IP：**192.168.110.169**

### Q: 端口被占用怎么办？

**80端口被占用**：
```bash
sudo lsof -i :80
sudo nginx -s stop
```

**8080端口被占用**：
```bash
lsof -i :8080
nginx -s stop
```

### Q: 如何查看nginx日志？

```bash
# 访问日志
tail -f /usr/local/var/log/nginx/access.log

# 错误日志
tail -f /usr/local/var/log/nginx/error.log
```

## 测试清单

启动后，按以下步骤测试：

- [ ] 前端服务运行在 localhost:3000
- [ ] 后端服务运行在 localhost:3001
- [ ] nginx启动成功
- [ ] 本机浏览器可以访问 `http://localhost` 或 `http://localhost:8080`
- [ ] 本机浏览器可以访问 `http://你的IP` 或 `http://你的IP:8080`
- [ ] SecondMe回调地址已添加
- [ ] 可以成功登录
- [ ] 其他设备可以访问

## 安全提示

⚠️ **重要**：此配置仅用于局域网内部，不要暴露到公网！

- 没有HTTPS加密
- 没有访问控制
- 仅适合开发和局域网游戏

## 恢复本地开发

```bash
./stop-lan.sh
```

然后重启前后端服务即可恢复localhost开发模式。

## 需要帮助？

查看详细文档：
- [LAN-SETUP.md](./LAN-SETUP.md) - 详细配置说明
- [INSTALL.md](./INSTALL.md) - 安装指南
- [QUICK-START-LAN.md](./QUICK-START-LAN.md) - 快速开始

---

**当前系统信息**：
- 局域网IP：192.168.110.169
- 推荐方案1回调地址：`http://192.168.110.169/auth/callback`
- 推荐方案2回调地址：`http://192.168.110.169:8080/auth/callback`
