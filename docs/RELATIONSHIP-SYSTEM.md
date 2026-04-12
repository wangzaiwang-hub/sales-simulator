# NPC关系和好感度系统

## 概述

添加了真实的人际关系系统，NPC不再对所有人都友好。每个NPC与玩家之间有独立的关系，包括好感度、熟悉度和关系类型。

## 核心概念

### 1. 好感度 (Affinity)
- 范围：-100 到 100
- 表示NPC对玩家的喜欢程度
- 影响NPC是否愿意交流
- 会随互动变化

### 2. 熟悉度 (Familiarity)
- 范围：0 到 100
- 表示双方的熟悉程度
- 随互动次数增加
- 影响关系类型的判定

### 3. 关系类型 (Relationship Type)

根据好感度和熟悉度自动确定：

- **陌生人 (stranger)**：初次见面，熟悉度低
- **熟人 (acquaintance)**：见过几次，熟悉度 > 20
- **朋友 (friend)**：好感度 > 40 且熟悉度 > 30
- **好友 (close_friend)**：好感度 > 70 且熟悉度 > 60
- **竞争对手 (rival)**：好感度 -20 到 -50
- **敌人 (enemy)**：好感度 < -50

## 社交决策逻辑

### 陌生人阶段

NPC对陌生人的态度取决于性格：

1. **社恐（外向性 < 25）**
   - 75%概率拒绝陌生人
   - 拒绝理由："不好意思，我不太习惯和陌生人说话..."

2. **内向（外向性 < 40）**
   - 50%概率拒绝陌生人
   - 社交能量低时更容易拒绝
   - 拒绝理由："抱歉，我现在不太想聊天。"

3. **神经质高（> 65）**
   - 40%概率拒绝陌生人
   - 对陌生人警惕
   - 拒绝理由："我们好像不认识吧..."

4. **开放性低（< 35）**
   - 35%概率拒绝陌生人
   - 不喜欢新接触
   - 拒绝理由："不好意思，我有点事。"

### 熟人阶段

- 好感度低（< -10）：50%概率拒绝
- 好感度中等：根据性格和状态决定
- 好感度高：更容易接受

### 朋友/好友阶段

- 几乎总是接受交流
- 除非压力非常大（> 85）

### 敌人/竞争对手阶段

- 70%概率拒绝
- 宜人性低时更容易拒绝
- 拒绝理由："我不想和你说话。"

## 初始好感度计算

第一次见面时，初始好感度由以下因素决定：

### 1. 性格相似度（30%权重）
- 开放性、外向性、宜人性的差异
- 越相似，初始好感越高

### 2. 宜人性加成（40%权重）
- 双方宜人性越高，初始好感越高
- 宜人性高的人对所有人都比较友好

### 3. 心情影响（30%权重）
- 双方心情好：+20
- 一方心情不好：-10
- 双方心情都不好：-20

### 结果范围
- 初始好感度：-20 到 40
- 陌生人不会一开始就很高

## 好感度变化

### 互动类型

1. **聊天 (chat)**
   - 基础变化：-5 到 +5（取决于对话质量）
   - 性格相似度加成：+2（相似度 > 70%）
   - 宜人性加成：+1（宜人性 > 60）

2. **送礼 (gift)**
   - 变化：+5 到 +10

3. **帮助 (help)**
   - 变化：+8 到 +15

4. **冲突 (conflict)**
   - 变化：-10 到 -20

5. **忽视 (ignore)**
   - 变化：-2 到 -5

### 边际效应递减

- 好感度 > 50：增长速度减半
- 好感度 < -30：提升难度增加（×0.3）

## 熟悉度变化

- 聊天：+2 到 +5
- 送礼/帮助：+3 到 +7
- 冲突：+1（负面的熟悉）
- 忽视：0

熟悉度 > 70 时增长减半

## 数据库结构

### Relationship 表

```sql
CREATE TABLE "Relationship" (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,           -- NPC的用户ID
    targetUserId TEXT NOT NULL,     -- 玩家的用户ID
    affinity INTEGER DEFAULT 0,     -- 好感度 -100 到 100
    familiarity INTEGER DEFAULT 0,  -- 熟悉度 0 到 100
    lastInteractionAt TIMESTAMP,    -- 最后互动时间
    interactionCount INTEGER DEFAULT 0,
    relationshipType TEXT DEFAULT 'stranger',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### InteractionHistory 表（可选）

记录详细的互动历史，用于分析和回溯。

## 前端显示

### 聊天界面

每条NPC回复下方显示：
- 关系类型：陌生人/熟人/朋友/好友/竞争对手/敌人
- 好感度：数值 + 文字描述 + 变化量
- 熟悉度：数值 + 文字描述 + 变化量

示例：
```
关系: 熟人
好感: 25 (有好感) (+3)
熟悉度: 35 (比较熟悉) (+4)
```

### 颜色编码

好感度颜色：
- ≥ 60：绿色（喜欢）
- ≥ 20：蓝色（有好感）
- ≥ 0：灰色（普通）
- ≥ -40：琥珀色（不喜欢）
- < -40：红色（讨厌）

## 使用方法

### 1. 运行数据库迁移

在Supabase Dashboard → SQL Editor 中运行：
```bash
backend/migrations/add-relationship-system.sql
```

### 2. 重启服务

```bash
# 停止所有服务
# 然后重新启动
cd backend && npm run dev
cd frontend && npm run dev
cd frontend && npm run dev:https-proxy
```

### 3. 测试系统

1. 访问游戏：https://192.168.110.169:3443/game
2. 尝试和不同NPC聊天
3. 观察拒绝情况：
   - 陌生人可能拒绝
   - 社恐NPC更容易拒绝
   - 内向NPC也会拒绝
4. 多次聊天后观察关系变化

## 测试场景

### 场景1：社恐NPC
- 外向性 < 25
- 第一次聊天：75%被拒绝
- 拒绝理由："不好意思，我不太习惯和陌生人说话..."

### 场景2：内向NPC
- 外向性 < 40
- 第一次聊天：50%被拒绝
- 多次互动后逐渐接受

### 场景3：友好NPC
- 宜人性 > 60
- 外向性 > 60
- 初始好感度较高
- 容易接受聊天

### 场景4：建立友谊
1. 第一次：陌生人，可能被拒绝
2. 多次聊天：变成熟人
3. 好感度提升：变成朋友
4. 继续互动：变成好友
5. 好友阶段：几乎不会拒绝

### 场景5：关系恶化
1. 冲突或忽视
2. 好感度下降
3. 变成竞争对手
4. 继续恶化：变成敌人
5. 敌人阶段：70%拒绝交流

## API接口

### 1. 聊天接口（已更新）

```typescript
POST /api/game/npc-chat
{
  npcId: string,
  message: string
}

// 响应
{
  reply: string,
  source: string,
  relationship: {
    affinity: number,
    familiarity: number,
    relationshipType: string,
    affinityChange: number,
    familiarityChange: number
  }
}
```

### 2. 获取关系列表

```typescript
GET /api/game/relationships

// 响应
[
  {
    id: string,
    userId: string,
    targetUserId: string,
    affinity: number,
    familiarity: number,
    relationshipType: string,
    interactionCount: number,
    lastInteractionAt: string,
    user: {
      id: string,
      username: string,
      avatar: string,
      profession: string
    }
  }
]
```

## 调试工具

### 检查关系数据

```sql
-- 查看所有关系
SELECT 
  r.*,
  u1.username as npc_name,
  u2.username as player_name
FROM "Relationship" r
JOIN "User" u1 ON r."userId" = u1.id
JOIN "User" u2 ON r."targetUserId" = u2.id
ORDER BY r."updatedAt" DESC;

-- 查看某个玩家的所有关系
SELECT * FROM "Relationship" 
WHERE "targetUserId" = '你的用户ID'
ORDER BY affinity DESC;
```

### 手动调整关系

```sql
-- 提高好感度
UPDATE "Relationship"
SET affinity = 60, familiarity = 50
WHERE "userId" = 'NPC用户ID' AND "targetUserId" = '玩家ID';

-- 设为敌人
UPDATE "Relationship"
SET affinity = -60, "relationshipType" = 'enemy'
WHERE "userId" = 'NPC用户ID' AND "targetUserId" = '玩家ID';
```

## 性能优化

### 缓存策略
- 关系数据可以缓存在前端
- 每次聊天后更新缓存
- 减少数据库查询

### 批量查询
- 获取地图时一次性加载所有关系
- 避免每次聊天都查询

## 未来改进

1. **关系衰减**
   - 长时间不互动，好感度和熟悉度下降
   - 模拟真实的人际关系

2. **间接关系**
   - 朋友的朋友
   - 敌人的敌人
   - 社交网络效应

3. **群体互动**
   - 多人对话
   - 群体好感度

4. **情绪记忆**
   - NPC记住上次对话的情绪
   - 影响下次互动

5. **礼物系统**
   - 送礼提升好感度
   - 不同NPC喜欢不同礼物

6. **任务系统**
   - 帮助NPC完成任务
   - 大幅提升好感度

## 常见问题

### Q: 为什么所有NPC都拒绝我？

A: 可能原因：
1. 你的性格设置太极端
2. NPC都是社恐（外向性低）
3. 数据库迁移未运行

解决：调整性格或多次尝试

### Q: 好感度提升太慢？

A: 这是设计的一部分，真实的关系需要时间建立。可以：
1. 多次聊天
2. 送礼（未来功能）
3. 帮助NPC（未来功能）

### Q: 如何快速变成好友？

A: 
1. 选择性格相似的NPC
2. 多次友好互动
3. 避免冲突和忽视
4. 需要好感度 > 70 且熟悉度 > 60

### Q: 敌人关系能修复吗？

A: 可以，但很难：
1. 好感度 < -30 时提升速度只有30%
2. 需要大量正面互动
3. 或者通过特殊事件（未来功能）
