# 快速参考手册

## 🚀 启动服务

```bash
# 方式1：使用脚本（推荐）
./start-https.sh

# 方式2：手动启动
# 终端1
cd backend && npm run dev

# 终端2
cd frontend && npm run dev

# 终端3
cd frontend && npm run dev:https-proxy
```

## 🌐 访问地址

- **本地**：https://127.0.0.1:3443
- **局域网**：https://192.168.110.169:3443
- **游戏页面**：/game
- **地图编辑器**：/editor

## 🗄️ 数据库迁移

在Supabase Dashboard → SQL Editor 中运行：

```sql
-- 1. 性格系统
backend/migrations/add-npc-personality.sql

-- 2. 关系系统
backend/migrations/add-relationship-system.sql

-- 3. 共享地图
backend/migrations/add-shared-map.sql
```

## 🔧 常用命令

### 检查数据库
```bash
cd backend
node check-database.js
```

### 复制共享地图
```bash
cd backend
node copy-map-to-shared.js
```

### 查看进程
```bash
lsof -i:3000,3001,3443
```

### 停止服务
```bash
# 找到进程ID
lsof -ti:3000,3001,3443

# 停止进程
kill -9 <PID>
```

## 📊 SQL查询

### 查看所有关系
```sql
SELECT 
  r.*,
  u1.username as npc_name,
  u2.username as player_name
FROM "Relationship" r
JOIN "User" u1 ON r."userId" = u1.id
JOIN "User" u2 ON r."targetUserId" = u2.id
ORDER BY r."updatedAt" DESC;
```

### 查看用户性格
```sql
SELECT 
  username,
  "personalityTraits",
  "currentMood",
  "activityStatus"
FROM "User"
ORDER BY "createdAt" DESC;
```

### 调整NPC性格
```sql
-- 让NPC更外向
UPDATE "User"
SET "personalityTraits" = jsonb_set(
  "personalityTraits",
  '{extraversion}',
  '70'
)
WHERE username = 'NPC名字';

-- 让NPC成为社恐
UPDATE "User"
SET "personalityTraits" = jsonb_set(
  "personalityTraits",
  '{extraversion}',
  '20'
)
WHERE username = 'NPC名字';
```

### 手动设置关系
```sql
-- 设为好友
UPDATE "Relationship"
SET 
  affinity = 75,
  familiarity = 65,
  "relationshipType" = 'close_friend'
WHERE "userId" = 'NPC用户ID' 
  AND "targetUserId" = '玩家ID';

-- 设为敌人
UPDATE "Relationship"
SET 
  affinity = -60,
  "relationshipType" = 'enemy'
WHERE "userId" = 'NPC用户ID' 
  AND "targetUserId" = '玩家ID';
```

## 🎮 游戏操作

### 移动
- **WASD** 或 **方向键**

### 与NPC互动
- **C键** 或 **点击NPC**

### 退出沉浸模式
- **Esc键**

## 📝 性格参数

### 外向性 (Extraversion)
- **> 70**：非常外向，主动社交
- **40-70**：适中
- **< 40**：内向，不喜欢社交
- **< 25**：社恐，拒绝陌生人

### 宜人性 (Agreeableness)
- **> 60**：友善，容易相处
- **40-60**：适中
- **< 40**：直率，可能拒绝
- **< 30**：不友好

### 神经质 (Neuroticism)
- **> 65**：敏感，对陌生人警惕
- **40-65**：适中
- **< 40**：稳定，不易焦虑

### 开放性 (Openness)
- **> 60**：好奇，喜欢新事物
- **40-60**：适中
- **< 35**：保守，不喜欢新接触

### 尽责性 (Conscientiousness)
- **> 60**：有条理，闲着会有压力
- **40-60**：适中
- **< 40**：随性，灵活

## 🎯 关系等级

### 好感度
- **80-100**：非常喜欢 🟢
- **60-79**：很喜欢 🟢
- **40-59**：喜欢 🔵
- **20-39**：有好感 🔵
- **0-19**：普通 ⚪
- **-20-(-1)**：不太喜欢 🟡
- **-40-(-21)**：不喜欢 🟡
- **-60-(-41)**：很不喜欢 🔴
- **< -60**：非常讨厌 🔴

### 关系类型
1. **陌生人**：初次见面
2. **熟人**：熟悉度 > 20
3. **朋友**：好感 > 40，熟悉 > 30
4. **好友**：好感 > 70，熟悉 > 60
5. **竞争对手**：好感 -20 到 -50
6. **敌人**：好感 < -50

## 🔍 故障排查

### 问题：无法访问HTTPS
```bash
# 检查证书
ls -la frontend/certs/

# 重新生成证书
cd frontend/certs
openssl req -x509 -newkey rsa:4096 \
  -keyout local-ip.key -out local-ip.crt \
  -days 365 -nodes \
  -config openssl-local-ip.cnf
```

### 问题：NPC都接受聊天
```bash
# 检查数据库迁移
cd backend
node check-database.js

# 运行迁移
# 在Supabase中运行 add-relationship-system.sql
```

### 问题：看不到NPC状态
```bash
# 清除浏览器缓存
# 重启前端
cd frontend
npm run dev
```

### 问题：后端报错
```bash
# 查看日志
# 检查终端输出

# 重启后端
cd backend
npm run dev
```

## 📚 文档索引

- **NPC-EMOTIONS-SYSTEM.md**：情绪系统详细说明
- **RELATIONSHIP-SYSTEM.md**：关系系统详细说明
- **TEST-RELATIONSHIP.md**：测试指南
- **HTTPS-SETUP.md**：HTTPS配置
- **DATABASE-TOOLS.md**：数据库工具
- **SUMMARY.md**：功能总结

## 🎨 状态颜色

### 活动状态
- **闲逛中**：灰色 (#94a3b8)
- **思考中**：蓝色 (#60a5fa)
- **忙碌中**：琥珀色 (#f59e0b)
- **交流中**：绿色 (#10b981)
- **工作中**：紫色 (#8b5cf6)
- **休息中**：青色 (#06b6d4)
- **争吵中**：红色 (#ef4444)
- **开心聊天**：琥珀色 (#f59e0b)
- **沉思中**：靛蓝色 (#6366f1)

## 🔑 环境变量

### 前端 (frontend/.env.local)
```env
NEXT_PUBLIC_SECONDME_CLIENT_ID=你的客户端ID
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://192.168.110.169:3443/auth/callback
NEXT_PUBLIC_API_URL=https://192.168.110.169:3443
BACKEND_URL=http://localhost:3001
```

### 后端 (backend/.env)
```env
PORT=3001
SUPABASE_URL=你的Supabase URL
SUPABASE_SERVICE_KEY=你的Service Key
FRONTEND_URL=https://192.168.110.169:3443
CORS_ORIGIN=https://192.168.110.169:3443
```

## 📞 支持

遇到问题？
1. 查看相关文档
2. 检查数据库迁移
3. 查看后端日志
4. 清除浏览器缓存
5. 重启所有服务

---

**版本**：v2.0.0
**更新**：2026-04-10
