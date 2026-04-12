# NPC情绪和社交系统

## 概述

为NPC添加了真实的情绪和性格系统，让数字分身更像真人。每个NPC都有独特的性格特征，会根据性格做出不同的行为决策。

## 性格特征系统（五大人格）

每个NPC有5个性格维度，每个维度0-100分：

### 1. 开放性 (Openness)
- 高分：好奇、创新、喜欢新事物
- 低分：保守、传统、喜欢熟悉的事物

### 2. 尽责性 (Conscientiousness)
- 高分：有条理、负责、勤奋
- 低分：随性、灵活、自发

### 3. 外向性 (Extraversion)
- 高分：社交、活跃、喜欢人群
- 低分：内向、安静、喜欢独处

### 4. 宜人性 (Agreeableness)
- 高分：友善、合作、信任他人
- 低分：竞争、直率、独立

### 5. 神经质 (Neuroticism)
- 高分：敏感、情绪化、容易焦虑
- 低分：稳定、冷静、抗压

## 情绪状态

NPC可以有以下情绪：
- 😊 开心 (happy)
- 😢 悲伤 (sad)
- 😠 生气 (angry)
- 🤩 兴奋 (excited)
- 😴 疲惫 (tired)
- 🤔 专注 (focused)
- 😕 困惑 (confused)
- 😌 平静 (calm)
- 😰 焦虑 (anxious)
- 😐 中性 (neutral)

## 活动状态

NPC头顶会显示当前状态：
- 闲逛中 (idle)
- 思考中 (thinking)
- 忙碌中 (busy)
- 交流中 (chatting)
- 工作中 (working)
- 休息中 (resting)
- 争吵中 (arguing)
- 开心聊天 (laughing)
- 沉思中 (pondering)

## 社交行为

### 接受社交的条件

NPC是否愿意和你聊天取决于：

1. **外向性**：外向的人更容易接受社交
2. **社交能量**：内向的人社交能量低时会拒绝
3. **压力水平**：压力大时可能拒绝
4. **当前心情**：心情不好且神经质高会拒绝
5. **宜人性**：宜人性低的人可能随机拒绝

拒绝理由示例：
- "我现在想一个人静静..."（内向且社交能量低）
- "抱歉，我现在有点忙..."（压力大）
- "我现在心情不太好，改天再聊吧。"（心情不好）
- "我正在和别人说话呢。"（正在社交）
- "不好意思，我不太想聊天。"（宜人性低）

### 主动发起社交

外向的NPC会主动找人聊天：
- 外向性 > 70 且社交能量 > 50：30%概率主动社交
- 外向性 > 50 且开放性 > 50：15%概率主动社交
- 外向性 > 40：5%概率主动社交

### NPC之间的互动

两个NPC相遇时，会根据双方性格决定互动类型：

1. **争吵中** (arguing)
   - 双方都心情不好
   - 或双方宜人性都很低

2. **开心聊天** (laughing)
   - 双方都心情好（开心或兴奋）

3. **沉思中** (pondering)
   - 一方或双方困惑

4. **交流中** (chatting)
   - 默认的正常交流

## 情绪动态变化

NPC的情绪会随时间变化：

### 社交能量
- 独处时恢复（内向的人恢复更快）
- 社交时消耗（内向的人消耗更快）

### 压力水平
- 尽责性高的人闲着会有压力
- 休息时压力降低
- 神经质高的人压力波动大

### 心情变化
- 压力大 → 焦虑或疲惫
- 社交能量低 → 疲惫
- 社交能量高 → 开心
- 压力低且社交能量适中 → 平静

## 数据库结构

### 新增字段

```sql
-- User表新增字段
personalityTraits JSONB  -- 性格特征
currentMood TEXT         -- 当前情绪
activityStatus TEXT      -- 活动状态
socialPreference TEXT    -- 社交偏好
```

### 迁移脚本

运行 `backend/migrations/add-npc-personality.sql` 添加这些字段。

## 实现细节

### 后端

1. **npcEmotions.ts**：核心情绪系统逻辑
   - 性格特征计算
   - 社交决策
   - 情绪更新

2. **npcs.ts**：NPC配置
   - 生成NPC时包含性格
   - 根据性格决定行为模式

3. **gameController.ts**：API
   - 返回NPC时包含情绪数据

### 前端

1. **npc-emotions.ts**：类型定义和工具函数
   - 状态显示文本
   - 状态颜色

2. **game/page.tsx**：游戏页面
   - 在NPC头顶显示状态
   - 彩色状态标签

## 使用方法

### 1. 运行数据库迁移

在Supabase Dashboard → SQL Editor 中运行：
```bash
backend/migrations/add-npc-personality.sql
```

### 2. 重启服务

```bash
# 停止所有服务
# 然后重新启动
cd backend && npm run dev
cd frontend && npm run dev
cd frontend && npm run dev:https-proxy
```

### 3. 进入游戏

访问 https://192.168.110.169:3443/game

你会看到：
- NPC头顶显示情绪表情和状态文本
- 不同状态有不同颜色
- 尝试和不同性格的NPC聊天，有些会拒绝

## 未来改进

可以考虑的功能：
1. NPC之间的关系系统（好友、敌人）
2. 记忆系统（记住之前的对话）
3. 情绪传染（一个NPC的情绪影响附近的NPC）
4. 更复杂的社交网络
5. 基于情绪的对话内容变化
6. 性格测试让用户设置自己的性格
7. 根据真实对话学习和调整性格

## 性格示例

### 外向开朗型
```json
{
  "openness": 75,
  "conscientiousness": 60,
  "extraversion": 85,
  "agreeableness": 70,
  "neuroticism": 30
}
```
行为：主动社交，容易接受对话，心情多为开心

### 内向思考型
```json
{
  "openness": 80,
  "conscientiousness": 75,
  "extraversion": 25,
  "agreeableness": 60,
  "neuroticism": 50
}
```
行为：很少主动社交，社交能量低时拒绝对话，常在思考或工作

### 竞争直率型
```json
{
  "openness": 60,
  "conscientiousness": 70,
  "extraversion": 65,
  "agreeableness": 30,
  "neuroticism": 40
}
```
行为：可能拒绝社交，容易和其他NPC争吵，状态多为忙碌

## 调试工具

检查NPC性格数据：
```bash
cd backend
node check-database.js
```

会显示用户的性格特征、当前情绪和活动状态。
