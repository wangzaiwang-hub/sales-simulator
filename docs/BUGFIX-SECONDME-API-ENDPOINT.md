# Bug修复：SecondMe API端点错误

## 问题

后端日志显示错误：
```
SecondMe AI evaluation failed: 404
```

## 原因分析

AI评估和状态更新使用了错误的SecondMe API端点。

### 错误的端点

```typescript
// ❌ 错误：这个端点不存在或需要不同的认证
const response = await fetch('https://api.second-me.cn/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secondmeAccessToken}`,
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  }),
});
```

### 正确的端点

NPC聊天功能使用的是正确的端点：

```typescript
// ✓ 正确：这是SecondMe实际使用的端点
const response = await fetch('https://api.mindverse.com/gate/lab/api/secondme/chat/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secondmeAccessToken}`,
  },
  body: JSON.stringify({
    message: prompt,
    systemPrompt: '...',
  }),
});
```

## 修复方案

### 1. 统一API端点

将AI评估和状态更新改为使用相同的SecondMe API端点：

**修改文件**：
- `backend/src/lib/aiRelationshipEvaluator.ts`
- `backend/src/lib/aiNpcState.ts`

**修改内容**：
```typescript
// 使用正确的SecondMe API端点
const response = await fetch('https://api.mindverse.com/gate/lab/api/secondme/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${secondmeAccessToken}`,
  },
  body: JSON.stringify({
    message: prompt,
    systemPrompt: '你是一个真实的人，请根据对话评估你的感受变化。',
  }),
});
```

### 2. 处理流式响应

SecondMe API返回的是流式响应（Server-Sent Events），需要正确解析：

```typescript
const raw = await response.text();

// 解析流式响应
const chunks: string[] = [];
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) {
    continue;
  }

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === '[DONE]') {
    continue;
  }

  try {
    const data = JSON.parse(payload);
    const content = data.choices?.[0]?.delta?.content || 
                   data.choices?.[0]?.message?.content;
    if (content) {
      chunks.push(content);
    }
  } catch {
    // 忽略解析错误
  }
}

const content = chunks.join('');
```

## 对比

### 旧实现（错误）

```typescript
// ❌ 使用了不存在的端点
fetch('https://api.second-me.cn/v1/chat/completions', {
  body: JSON.stringify({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  }),
});

// ❌ 期望JSON响应
const data = await response.json();
const content = data.choices?.[0]?.message?.content;
```

### 新实现（正确）

```typescript
// ✓ 使用正确的端点
fetch('https://api.mindverse.com/gate/lab/api/secondme/chat/stream', {
  body: JSON.stringify({
    message: prompt,
    systemPrompt: '...',
  }),
});

// ✓ 处理流式响应
const raw = await response.text();
// 解析SSE格式的流式数据
const chunks = parseStreamResponse(raw);
const content = chunks.join('');
```

## 影响范围

### 修复的功能

1. **AI关系评估**：
   - 好感度评判
   - 熟悉度评判
   - 心情和状态更新

2. **AI状态更新**：
   - 定期更新NPC状态
   - 根据性格和情境更新

### 不受影响的功能

1. **NPC聊天**：一直使用正确的端点，无需修改
2. **其他功能**：不涉及SecondMe API调用

## 测试

### 测试1：AI评估

1. 与NPC对话
2. 观察后端日志
3. 应该不再出现404错误
4. 应该能看到AI评估结果

### 测试2：状态更新

1. 调用 `POST /api/game/update-npc-states`
2. 观察后端日志
3. 应该不再出现404错误
4. 应该能看到NPC状态更新

### 测试3：聊天记录

1. 与NPC对话
2. 查看聊天窗口
3. 应该能看到：
   - AI的评判理由
   - 情绪反应
   - 好感度和熟悉度变化

## 关于avatar.read权限错误

日志中还有另一个警告：
```
SecondMe NPC api key sync skipped during chat: 缺少必需的权限: avatar.read
```

这个是SecondMe API Key同步功能的警告，不影响主要功能。如果需要修复：

1. 在SecondMe平台申请 `avatar.read` 权限
2. 或者移除API Key同步功能（如果不需要）

目前这个警告可以忽略，不影响聊天和AI评估功能。

## 版本信息

- **修复日期**：2026-04-10
- **版本**：v3.2.2
- **影响范围**：AI评估和状态更新
- **向后兼容**：是

## 相关文档

- [AI-DRIVEN-RELATIONSHIP.md](./AI-DRIVEN-RELATIONSHIP.md) - AI关系评估系统
- [AI-DRIVEN-NPC-STATES.md](./AI-DRIVEN-NPC-STATES.md) - AI状态系统

---

**总结**：修复了SecondMe API端点错误，AI评估和状态更新现在使用正确的API端点，不再出现404错误。
