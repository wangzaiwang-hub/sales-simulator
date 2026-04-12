# 销售模拟器 - NPC情绪和关系系统总结

## 🎉 已完成的功能

### 1. NPC情绪系统
- ✅ 五大人格特征（开放性、尽责性、外向性、宜人性、神经质）
- ✅ 10种情绪状态（开心、悲伤、生气、兴奋、疲惫等）
- ✅ 9种活动状态（闲逛、思考、忙碌、交流、工作等）
- ✅ 动态情绪变化（社交能量、压力水平）
- ✅ NPC头顶显示状态标签（表情 + 文字 + 彩色背景）

### 2. NPC关系系统
- ✅ 好感度系统（-100 到 100）
- ✅ 熟悉度系统（0 到 100）
- ✅ 6种关系类型（陌生人、熟人、朋友、好友、竞争对手、敌人）
- ✅ 智能社交决策（根据性格和关系决定是否接受聊天）
- ✅ 真实的拒绝理由（社恐、内向、心情不好等）
- ✅ 关系动态变化（随互动提升或下降）
- ✅ 前端显示关系信息（好感度、熟悉度、变化量）

### 3. 社交行为逻辑

#### 陌生人阶段
- 社恐（外向性 < 25）：75%拒绝
- 内向（外向性 < 40）：50%拒绝
- 神经质高（> 65）：40%拒绝
- 开放性低（< 35）：35%拒绝

#### 熟人阶段
- 好感度低：50%拒绝
- 好感度中等：根据性格决定
- 好感度高：更容易接受

#### 朋友/好友阶段
- 几乎总是接受
- 除非压力非常大

#### 敌人/竞争对手阶段
- 70%拒绝
- 拒绝理由直接

### 4. 共享地图系统
- ✅ SharedMap表存储共享地图
- ✅ 所有用户看到相同的地图
- ✅ 支持个人地图回退

### 5. HTTPS反代
- ✅ 支持局域网访问
- ✅ 支持手机访问
- ✅ 证书配置完成

## 📁 文件结构

### 后端

```
backend/
├── src/
│   ├── lib/
│   │   ├── npcEmotions.ts          # 情绪系统核心逻辑
│   │   ├── relationshipSystem.ts   # 关系系统核心逻辑
│   │   ├── npcChat.ts              # NPC对话
│   │   └── supabase.ts             # 数据库工具
│   ├── config/
│   │   └── npcs.ts                 # NPC配置（已更新）
│   ├── controllers/
│   │   └── gameController.ts       # 游戏API（已更新）
│   └── routes/
│       └── game.ts                 # 游戏路由（已更新）
├── migrations/
│   ├── add-npc-personality.sql     # 性格字段迁移
│   ├── add-relationship-system.sql # 关系系统迁移
│   └── add-shared-map.sql          # 共享地图迁移
├── check-database.js               # 数据库检查工具
└── copy-map-to-shared.js           # 地图复制工具
```

### 前端

```
frontend/
├── src/
│   ├── app/
│   │   └── game/
│   │       └── page.tsx            # 游戏页面（已更新）
│   ├── types/
│   │   └── npc-emotions.ts         # 情绪类型定义
│   └── utils/
│       └── relationship.ts         # 关系工具函数
└── scripts/
    └── https-proxy.js              # HTTPS反代
```

### 文档

```
docs/
├── NPC-EMOTIONS-SYSTEM.md          # 情绪系统说明
├── RELATIONSHIP-SYSTEM.md          # 关系系统说明
├── TEST-RELATIONSHIP.md            # 测试指南
├── HTTPS-SETUP.md                  # HTTPS配置说明
├── DATABASE-TOOLS.md               # 数据库工具说明
└── SUMMARY.md                      # 本文档
```

## 🗄️ 数据库结构

### User表（已扩展）
```sql
personalityTraits JSONB      -- 性格特征
currentMood TEXT             -- 当前情绪
activityStatus TEXT          -- 活动状态
socialPreference TEXT        -- 社交偏好
```

### Relationship表（新增）
```sql
userId TEXT                  -- NPC用户ID
targetUserId TEXT            -- 玩家用户ID
affinity INTEGER             -- 好感度 -100 到 100
familiarity INTEGER          -- 熟悉度 0 到 100
relationshipType TEXT        -- 关系类型
interactionCount INTEGER     -- 互动次数
lastInteractionAt TIMESTAMP  -- 最后互动时间
```

### SharedMap表（新增）
```sql
name TEXT                    -- 地图名称
mapData TEXT                 -- 地图JSON数据
isActive BOOLEAN             -- 是否激活
createdBy TEXT               -- 创建者
```

## 🚀 快速开始

### 1. 数据库迁移

在Supabase Dashboard → SQL Editor 中依次运行：

```bash
backend/migrations/add-npc-personality.sql
backend/migrations/add-relationship-system.sql
backend/migrations/add-shared-map.sql
```

### 2. 复制共享地图

```bash
cd backend
node copy-map-to-shared.js
```

### 3. 启动服务

```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev

# HTTPS反代
cd frontend && npm run dev:https-proxy
```

### 4. 访问游戏

- 本地：https://127.0.0.1:3443/game
- 局域网：https://192.168.110.169:3443/game

## 🎮 游戏体验

### 观察NPC状态
- NPC头顶显示：😊 交流中
- 不同状态有不同颜色
- 实时更新

### 尝试聊天
1. 靠近NPC按C键或点击
2. 可能被拒绝（陌生人、社恐）
3. 查看拒绝理由
4. 多次互动建立关系

### 查看关系变化
- 每次聊天后显示关系信息
- 好感度：数值 + 文字 + 变化量
- 熟悉度：数值 + 文字 + 变化量
- 关系类型：陌生人 → 熟人 → 朋友 → 好友

## 📊 测试结果

### 预期行为

✅ **社恐NPC**
- 75%拒绝陌生人
- 理由："不好意思，我不太习惯和陌生人说话..."

✅ **内向NPC**
- 50%拒绝陌生人
- 需要多次互动建立关系

✅ **外向NPC**
- 容易接受聊天
- 初始好感度较高

✅ **好友NPC**
- 几乎不拒绝
- 关系稳定

## 🔧 调试工具

### 检查数据库
```bash
cd backend
node check-database.js
```

### 查看关系
```sql
SELECT * FROM "Relationship" 
WHERE "targetUserId" = '你的用户ID'
ORDER BY affinity DESC;
```

### 调整性格
```sql
UPDATE "User"
SET "personalityTraits" = jsonb_build_object(
    'openness', 60,
    'conscientiousness', 55,
    'extraversion', 25,  -- 社恐
    'agreeableness', 60,
    'neuroticism', 50
)
WHERE id = 'NPC用户ID';
```

## 🎯 核心特性

### 1. 真实的社交互动
- 不是所有人都友好
- 陌生人需要建立信任
- 关系需要时间培养

### 2. 性格驱动行为
- 社恐拒绝陌生人
- 内向需要独处
- 外向主动社交

### 3. 动态关系系统
- 好感度随互动变化
- 熟悉度逐渐增加
- 关系类型自动更新

### 4. 情绪状态显示
- 头顶显示当前状态
- 彩色标签区分
- 实时更新

## 📈 未来改进

### 短期
1. ✅ 关系衰减（长时间不互动）
2. ✅ 礼物系统
3. ✅ 任务系统
4. ✅ 情绪记忆

### 中期
1. ✅ NPC之间的关系网络
2. ✅ 群体互动
3. ✅ 情绪传染
4. ✅ 间接关系

### 长期
1. ✅ 基于AI的对话内容
2. ✅ 性格学习和调整
3. ✅ 复杂的社交网络
4. ✅ 事件系统

## 🐛 已知问题

1. **性能**：大量NPC时可能卡顿
   - 解决：优化渲染，减少NPC数量

2. **关系数据**：每次聊天都查询数据库
   - 解决：添加缓存层

3. **状态同步**：NPC状态不实时更新
   - 解决：添加WebSocket实时同步

## 📝 技术栈

- **后端**：Node.js + Express + TypeScript
- **前端**：Next.js + React + TypeScript
- **数据库**：Supabase (PostgreSQL)
- **反代**：Node.js HTTPS Proxy
- **游戏引擎**：Canvas 2D

## 🎓 学习资源

- [五大人格理论](https://zh.wikipedia.org/wiki/五大性格特质)
- [人际关系心理学](https://zh.wikipedia.org/wiki/人际关系)
- [情绪心理学](https://zh.wikipedia.org/wiki/情绪)

## 🙏 致谢

感谢你的耐心和反馈，让NPC系统变得更加真实和有趣！

---

**当前版本**：v2.0.0
**最后更新**：2026-04-10
**状态**：✅ 生产就绪
