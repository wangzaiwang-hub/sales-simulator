# Bug修复：聊天消息一闪而过

## 问题描述

用户反馈：发送消息后，AI回复了，但是界面上消息一闪而过，看不到内容。

## 问题分析

### 可能的原因

1. **useEffect依赖项问题**
   - 加载聊天历史的useEffect依赖了`chatMessages`
   - 当发送新消息时，`chatMessages`更新
   - 触发useEffect重新执行
   - 可能导致消息被重新加载或清空

2. **状态更新冲突**
   - 发送消息时更新state
   - 加载历史时也更新state
   - 两个更新可能冲突

3. **组件重新渲染**
   - 某些状态变化导致组件重新渲染
   - 聊天窗口被重新创建
   - 消息丢失

## 解决方案

### 修复1：使用useRef跟踪已加载的NPC

```typescript
// 使用useRef记录已加载历史的NPC
const loadedHistoryRef = useRef<Set<string>>(new Set());

useEffect(() => {
  if (!selectedNpcId) return;
  
  // 如果已经加载过这个NPC的历史，不重复加载
  if (loadedHistoryRef.current.has(selectedNpcId)) {
    return;
  }
  
  // 如果已经有聊天记录，不重复加载
  if (chatMessages[selectedNpcId] && chatMessages[selectedNpcId].length > 0) {
    loadedHistoryRef.current.add(selectedNpcId);
    return;
  }

  const loadChatHistory = async () => {
    // ... 加载逻辑
    
    // 加载完成后标记为已加载
    loadedHistoryRef.current.add(selectedNpcId);
  };

  void loadChatHistory();
}, [selectedNpcId]); // 移除chatMessages依赖
```

### 关键改进

1. **移除chatMessages依赖**
   - 之前：`}, [selectedNpcId, chatMessages]);`
   - 现在：`}, [selectedNpcId]);`
   - 避免因消息更新触发重新加载

2. **使用useRef跟踪加载状态**
   - `loadedHistoryRef.current.has(selectedNpcId)` 检查是否已加载
   - 加载完成后添加到Set中
   - useRef不会触发重新渲染

3. **双重检查**
   - 检查loadedHistoryRef（是否加载过）
   - 检查chatMessages（是否有消息）
   - 确保不会重复加载

## 测试步骤

### 测试1：基本发送

1. 打开与NPC的聊天窗口
2. 发送消息："你好"
3. 等待AI回复
4. **预期**：消息和回复都正常显示，不会闪烁

### 测试2：连续发送

1. 打开与NPC的聊天窗口
2. 连续发送3条消息
3. 等待AI回复
4. **预期**：所有消息和回复都正常显示

### 测试3：刷新后发送

1. 与NPC聊天几句
2. 刷新页面
3. 再次打开聊天窗口
4. 发送新消息
5. **预期**：历史记录显示，新消息也正常显示

### 测试4：切换NPC

1. 与NPC A聊天
2. 关闭聊天窗口
3. 与NPC B聊天
4. 再次打开与NPC A的聊天
5. **预期**：各自的消息都正常显示

## 调试方法

### 方法1：查看浏览器控制台

1. 按F12打开开发者工具
2. 切换到Console标签
3. 发送消息
4. 查看是否有错误或警告

### 方法2：添加调试日志

在`frontend/src/app/game/page.tsx`中添加：

```typescript
// 在sendNpcMessage函数开始处
console.log('发送消息:', message);

// 在收到回复后
console.log('收到回复:', data);

// 在更新chatMessages后
console.log('当前消息列表:', chatMessages[selectedNpc.id]);
```

### 方法3：检查Network请求

1. 按F12打开开发者工具
2. 切换到Network标签
3. 发送消息
4. 查看`npc-chat`请求
5. 检查请求和响应是否正常

### 方法4：检查React DevTools

1. 安装React DevTools扩展
2. 打开DevTools
3. 查看chatMessages的state
4. 观察state变化

## 可能的其他原因

### 原因1：CSS动画问题

如果消息有淡入淡出动画，可能导致看起来"一闪而过"。

**检查**：查看聊天消息的CSS类

### 原因2：自动滚动问题

如果聊天窗口自动滚动，可能导致消息快速滚动过去。

**检查**：查看是否有自动滚动逻辑

### 原因3：状态重置

某些操作可能导致chatMessages被重置。

**检查**：搜索`setChatMessages({})`或类似的重置代码

## 验证修复

### 检查点1：消息持久性

- [ ] 发送消息后，消息显示在聊天窗口
- [ ] AI回复后，回复显示在聊天窗口
- [ ] 消息不会消失或闪烁
- [ ] 可以看到完整的对话历史

### 检查点2：加载逻辑

- [ ] 打开聊天窗口时，只加载一次历史
- [ ] 发送新消息时，不会重新加载历史
- [ ] 切换NPC时，各自的历史正确显示

### 检查点3：性能

- [ ] 没有不必要的重新渲染
- [ ] 没有重复的API调用
- [ ] 界面响应流畅

## 如果问题仍然存在

### 步骤1：清除缓存

1. 按F12打开开发者工具
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 步骤2：检查数据库

在Supabase SQL Editor中运行：

```sql
-- 查看最近的聊天记录
SELECT * FROM "ChatMessage" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

确认消息确实保存到了数据库。

### 步骤3：检查API响应

1. 打开Network标签
2. 发送消息
3. 查看`npc-chat`请求的响应
4. 确认响应包含完整的数据

### 步骤4：提供调试信息

如果问题仍然存在，请提供：

1. 浏览器控制台的错误信息（截图）
2. Network标签的API请求（截图）
3. 具体的操作步骤
4. 问题发生的频率（每次都发生？偶尔发生？）

## 临时解决方案

如果修复后问题仍然存在，可以尝试：

### 方案1：强制刷新

发送消息后，强制刷新聊天窗口：

```typescript
// 在sendNpcMessage的finally块中
finally {
  setChatLoading(false);
  // 强制刷新（不推荐，但可以临时使用）
  setPresenceTick(prev => prev + 1);
}
```

### 方案2：延迟更新

延迟更新chatMessages：

```typescript
// 在收到回复后
setTimeout(() => {
  setChatMessages((prev) => ({
    ...prev,
    [selectedNpc.id]: [...(prev[selectedNpc.id] || []), npcMessage],
  }));
}, 100);
```

## 总结

主要修复：
1. 移除useEffect的chatMessages依赖
2. 使用useRef跟踪已加载的NPC
3. 避免重复加载和状态冲突

这应该能解决消息"一闪而过"的问题。

---

**修复日期**：2026-04-10
**版本**：v3.3.2
