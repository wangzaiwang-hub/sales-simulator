# Bug修复：聊天记录加载

## 问题

用户反馈：刷新页面后聊天记录不显示，感觉没有记录到数据库里面。

## 原因分析

### 后端

后端已经正确实现了聊天记录保存功能：
- ✅ ChatMessage表已创建
- ✅ 每次对话后都保存到数据库
- ✅ 提供了获取聊天历史的API：`GET /api/game/chat-history`

### 前端

前端的问题：
- ✅ 聊天记录保存在内存中（React state）
- ❌ 刷新页面后state清空
- ❌ 没有从数据库加载历史记录

## 解决方案

### 添加加载聊天历史的逻辑

在前端添加一个useEffect，当打开聊天窗口时自动加载历史记录：

```typescript
// 加载聊天历史
useEffect(() => {
  if (!selectedNpcId) return;
  
  // 如果已经有聊天记录，不重复加载
  if (chatMessages[selectedNpcId] && chatMessages[selectedNpcId].length > 0) {
    return;
  }

  const loadChatHistory = async () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return;

    try {
      const response = await fetch(
        `${apiUrl}/api/game/chat-history?targetUserId=${selectedNpcId}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error('Failed to load chat history');
        return;
      }

      const history = await response.json();

      // 转换为ChatMessage格式
      const messages: ChatMessage[] = [];
      for (const record of history.reverse()) {
        // 用户消息
        messages.push({
          role: 'user',
          text: record.message,
        });
        
        // NPC回复
        messages.push({
          role: 'npc',
          text: record.reply,
          relationship: { ... },
          aiEvaluation: { ... },
        });
      }

      setChatMessages((prev) => ({
        ...prev,
        [selectedNpcId]: messages,
      }));
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  void loadChatHistory();
}, [selectedNpcId, chatMessages]);
```

## 工作流程

### 之前的流程（有问题）

```
1. 用户与NPC聊天
   ↓
2. 聊天记录保存到数据库 ✓
   ↓
3. 聊天记录显示在前端（内存中）✓
   ↓
4. 用户刷新页面
   ↓
5. 前端state清空 ✗
   ↓
6. 聊天记录消失 ✗
```

### 现在的流程（已修复）

```
1. 用户与NPC聊天
   ↓
2. 聊天记录保存到数据库 ✓
   ↓
3. 聊天记录显示在前端（内存中）✓
   ↓
4. 用户刷新页面
   ↓
5. 前端state清空
   ↓
6. 用户打开聊天窗口
   ↓
7. 自动从数据库加载历史记录 ✓
   ↓
8. 聊天记录显示 ✓
```

## 功能特点

### 1. 自动加载

- 打开聊天窗口时自动加载
- 无需用户手动操作
- 无缝体验

### 2. 避免重复加载

```typescript
// 如果已经有聊天记录，不重复加载
if (chatMessages[selectedNpcId] && chatMessages[selectedNpcId].length > 0) {
  return;
}
```

### 3. 完整信息

加载的历史记录包含：
- 用户消息
- NPC回复
- 好感度和熟悉度
- 好感度和熟悉度变化
- AI评判理由
- AI情绪反应

### 4. 正确顺序

```typescript
// 反转顺序，最早的在前
for (const record of history.reverse()) {
  // ...
}
```

## 数据格式

### 数据库格式

```json
{
  "id": "...",
  "userId": "user-id",
  "targetUserId": "npc-id",
  "message": "你最近在做什么？",
  "reply": "我最近在学习新技术...",
  "affinity": 28,
  "familiarity": 38,
  "relationshipType": "acquaintance",
  "affinityChange": 3,
  "familiarityChange": 4,
  "aiReasoning": "对方关心我在做什么...",
  "aiEmotionalResponse": "感觉还不错。",
  "createdAt": "2026-04-10T12:34:56.789Z"
}
```

### 前端格式

```typescript
// 用户消息
{
  role: 'user',
  text: '你最近在做什么？'
}

// NPC回复
{
  role: 'npc',
  text: '我最近在学习新技术...',
  relationship: {
    affinity: 28,
    familiarity: 38,
    relationshipType: 'acquaintance',
    affinityChange: 3,
    familiarityChange: 4
  },
  aiEvaluation: {
    reasoning: '对方关心我在做什么...',
    emotionalResponse: '感觉还不错。',
    newMood: '',
    newActivityStatus: ''
  }
}
```

## 测试步骤

### 测试1：基本加载

1. 与NPC聊天几句
2. 刷新页面
3. 再次打开与该NPC的聊天窗口
4. 预期：之前的聊天记录显示

### 测试2：多个NPC

1. 与NPC A聊天
2. 与NPC B聊天
3. 刷新页面
4. 打开与NPC A的聊天窗口
5. 预期：显示与A的聊天记录
6. 打开与NPC B的聊天窗口
7. 预期：显示与B的聊天记录

### 测试3：关系信息

1. 与NPC聊天
2. 观察好感度和熟悉度变化
3. 刷新页面
4. 再次打开聊天窗口
5. 预期：历史记录中显示之前的关系变化

### 测试4：AI评估

1. 与NPC聊天
2. 观察AI的评判理由和情绪反应
3. 刷新页面
4. 再次打开聊天窗口
5. 预期：历史记录中显示AI的评估信息

## 注意事项

### 1. 加载限制

```typescript
// 默认加载最近50条记录
`${apiUrl}/api/game/chat-history?targetUserId=${selectedNpcId}&limit=50`
```

如果聊天记录超过50条，只显示最近的50条。可以根据需要调整limit参数。

### 2. 性能优化

- 只在打开聊天窗口时加载
- 如果已经有记录，不重复加载
- 避免不必要的API调用

### 3. 错误处理

```typescript
try {
  // 加载聊天历史
} catch (error) {
  console.error('Error loading chat history:', error);
  // 不影响用户继续聊天
}
```

即使加载失败，用户仍然可以继续聊天。

## 未来改进

### 1. 分页加载

当聊天记录很多时，可以实现分页加载：
- 初始加载最近20条
- 滚动到顶部时加载更多
- 无限滚动

### 2. 缓存策略

- 使用localStorage缓存最近的聊天记录
- 减少API调用
- 提高加载速度

### 3. 实时同步

- 使用WebSocket实时同步聊天记录
- 多设备同步
- 更好的用户体验

### 4. 搜索功能

- 搜索聊天记录
- 按日期筛选
- 按关键词查找

## 版本信息

- **修复日期**：2026-04-10
- **版本**：v3.3.1
- **影响范围**：前端聊天历史加载
- **向后兼容**：是

## 相关文档

- [CHAT-HISTORY-SETUP.md](./CHAT-HISTORY-SETUP.md) - 聊天记录系统设置
- [QUICK-SETUP-CHAT-HISTORY.md](./QUICK-SETUP-CHAT-HISTORY.md) - 快速设置指南

---

**总结**：修复了聊天记录加载问题，现在刷新页面后聊天记录会自动从数据库加载并显示。
