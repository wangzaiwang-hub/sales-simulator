# 聊天记录系统设置指南

## 问题

聊天记录和好感度信息没有保存到数据库。

## 解决方案

我们创建了一个新的 `ChatMessage` 表来保存完整的聊天记录，包括：
- 用户消息和NPC回复
- 好感度和熟悉度变化
- AI评估的理由和情绪反应
- NPC的心情和状态变化

## 设置步骤

### 1. 运行数据库迁移

有两种方式运行迁移：

#### 方式A：使用脚本（推荐）

```bash
cd backend
node run-chat-history-migration.js
```

如果脚本提示需要手动执行，请使用方式B。

#### 方式B：手动执行（最可靠）

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 打开文件 `backend/migrations/add-chat-history.sql`
4. 复制所有内容
5. 粘贴到 SQL Editor
6. 点击 **Run** 执行

### 2. 验证表创建成功

在 Supabase Dashboard → Table Editor 中，你应该能看到新表：
- `ChatMessage` - 聊天记录表

### 3. 重启后端服务

```bash
# 如果后端正在运行，重启它
cd backend
npm run dev
```

## 数据库表结构

### ChatMessage 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| userId | TEXT | 发送者ID（玩家） |
| targetUserId | TEXT | 接收者ID（NPC） |
| message | TEXT | 用户消息 |
| reply | TEXT | NPC回复 |
| source | TEXT | 回复来源 |
| affinity | INTEGER | 当时的好感度 |
| familiarity | INTEGER | 当时的熟悉度 |
| relationshipType | TEXT | 当时的关系类型 |
| affinityChange | INTEGER | 好感度变化 |
| familiarityChange | INTEGER | 熟悉度变化 |
| aiReasoning | TEXT | AI评判理由 |
| aiEmotionalResponse | TEXT | AI情绪反应 |
| npcMoodBefore | TEXT | 对话前NPC心情 |
| npcMoodAfter | TEXT | 对话后NPC心情 |
| npcStatusBefore | TEXT | 对话前NPC状态 |
| npcStatusAfter | TEXT | 对话后NPC状态 |
| createdAt | TIMESTAMP | 创建时间 |

## 新增API端点

### 获取聊天历史

```
GET /api/game/chat-history?targetUserId=<npc-user-id>&limit=50&offset=0
```

**参数**：
- `targetUserId` (必需): NPC的用户ID
- `limit` (可选): 返回记录数，默认50
- `offset` (可选): 偏移量，默认0

**响应**：
```json
[
  {
    "id": "...",
    "userId": "...",
    "targetUserId": "...",
    "message": "你最近在做什么创作？",
    "reply": "我最近在写一个关于AI的故事...",
    "source": "secondme-visitor",
    "affinity": 28,
    "familiarity": 38,
    "relationshipType": "acquaintance",
    "affinityChange": 3,
    "familiarityChange": 3,
    "aiReasoning": "对方问到了我感兴趣的创作话题，而且态度很真诚，让我感觉很舒服。",
    "aiEmotionalResponse": "我感到很兴奋，想继续聊下去。",
    "npcMoodBefore": "neutral",
    "npcMoodAfter": "excited",
    "npcStatusBefore": "idle",
    "npcStatusAfter": "chatting",
    "createdAt": "2026-04-10T12:34:56.789Z"
  }
]
```

## 功能说明

### 自动保存

每次与NPC对话后，系统会自动保存：

1. **完整对话内容**
   - 用户发送的消息
   - NPC的回复

2. **关系变化**
   - 好感度变化（+3, -2等）
   - 熟悉度变化
   - 关系类型变化

3. **AI评估结果**
   - AI的评判理由（第一人称）
   - AI的情绪反应描述

4. **NPC状态变化**
   - 对话前后的心情变化
   - 对话前后的活动状态变化

### 查询历史

前端可以调用 `/api/game/chat-history` 来获取与某个NPC的完整聊天历史，用于：
- 显示聊天记录
- 分析关系发展趋势
- 回顾重要对话

## 测试

### 1. 测试聊天保存

1. 进入游戏
2. 与任意NPC对话
3. 在 Supabase Dashboard → Table Editor → ChatMessage 中查看
4. 应该能看到新的聊天记录

### 2. 测试数据完整性

检查保存的记录是否包含：
- ✅ 用户消息
- ✅ NPC回复
- ✅ 好感度和熟悉度
- ✅ AI评估理由
- ✅ NPC心情和状态变化

### 3. 测试API

使用浏览器或Postman测试：

```bash
# 获取聊天历史（需要替换token和targetUserId）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-backend.com/api/game/chat-history?targetUserId=NPC_USER_ID"
```

## 数据查询示例

### 查看最近的聊天记录

```sql
SELECT 
  message,
  reply,
  "affinityChange",
  "aiReasoning",
  "createdAt"
FROM "ChatMessage"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### 查看与特定NPC的对话

```sql
SELECT *
FROM "ChatMessage"
WHERE "targetUserId" = 'NPC_USER_ID'
ORDER BY "createdAt" DESC;
```

### 统计好感度变化

```sql
SELECT 
  "targetUserId",
  COUNT(*) as "messageCount",
  SUM("affinityChange") as "totalAffinityChange",
  AVG("affinityChange") as "avgAffinityChange"
FROM "ChatMessage"
WHERE "userId" = 'YOUR_USER_ID'
GROUP BY "targetUserId";
```

## 注意事项

1. **存储空间**：聊天记录会占用数据库空间，建议定期清理旧记录
2. **性能**：大量聊天记录可能影响查询性能，已创建索引优化
3. **隐私**：聊天记录包含敏感信息，注意数据安全

## 未来改进

1. **聊天记录分页**：前端实现无限滚动加载历史记录
2. **搜索功能**：按关键词搜索聊天内容
3. **导出功能**：导出聊天记录为文本文件
4. **数据分析**：可视化关系发展趋势
5. **自动清理**：定期清理超过N天的旧记录

## 相关文档

- [AI-DRIVEN-RELATIONSHIP.md](./AI-DRIVEN-RELATIONSHIP.md) - AI评估系统
- [RELATIONSHIP-SYSTEM.md](./RELATIONSHIP-SYSTEM.md) - 关系系统
- [DATABASE-TOOLS.md](./DATABASE-TOOLS.md) - 数据库工具

---

**版本**: v3.1.0  
**更新**: 2026-04-10  
**状态**: ✅ 已实现
