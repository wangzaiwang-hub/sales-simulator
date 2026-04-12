# 快速设置：聊天记录保存

## 问题
聊天记录和好感度没有保存到数据库。

## 解决方案
已添加 `ChatMessage` 表来保存所有聊天记录。

## 立即执行（3步）

### 1️⃣ 运行数据库迁移

打开 **Supabase Dashboard**：

1. 进入 **SQL Editor**
2. 复制文件内容：`backend/migrations/add-chat-history.sql`
3. 粘贴并点击 **Run**

### 2️⃣ 验证表创建

在 **Table Editor** 中应该能看到新表：
- ✅ `ChatMessage`

### 3️⃣ 测试

1. 进入游戏
2. 与NPC对话
3. 在 Supabase → Table Editor → ChatMessage 查看记录

## 保存的内容

每次对话会保存：
- 💬 完整对话（用户消息 + NPC回复）
- 💝 好感度和熟悉度变化
- 🤖 AI评估理由和情绪反应
- 😊 NPC心情和状态变化

## 查看记录

在 Supabase SQL Editor 执行：

```sql
-- 查看最近10条聊天记录
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

## 完成！

现在所有聊天记录都会自动保存到数据库了。

---

详细文档：[CHAT-HISTORY-SETUP.md](./CHAT-HISTORY-SETUP.md)
