# SecondMe 接入实现策略（对外说明版）

这份文档用于向团队成员或协作者说明：我们在销售模拟器里如何接入 SecondMe，并保证“每个用户独立身份、连续上下文、可恢复、可观测”。

适用代码范围：
- `/Users/wangzaiwng/Desktop/销售模拟器/backend/src/controllers/authController.ts`
- `/Users/wangzaiwng/Desktop/销售模拟器/backend/src/controllers/gameController.ts`
- `/Users/wangzaiwng/Desktop/销售模拟器/backend/src/lib/npcChat.ts`
- `/Users/wangzaiwng/Desktop/销售模拟器/backend/src/lib/conversationMemory.ts`
- `/Users/wangzaiwng/Desktop/销售模拟器/backend/src/lib/secondmeAvatar.ts`

## 1. 核心目标

1. 每个用户有自己的 SecondMe 身份与 token，不共享。
2. 每个用户可获得自己的分身 API Key（`secondmeApiKey`），用于 visitor-chat。
3. 聊天连续，不是“每句新会话”。
4. 失败时有兜底，不会让玩家卡死在“无回复”。
5. 对话有阶段记忆，并可同步到 Note 做持久化。

## 2. 每个用户 API Key 的获取策略（重点）

### 2.1 获取入口

用户完成 OAuth 回调后，后端拿到用户 access token（`secondmeAccessToken`）并落库到 `User` 表。

### 2.2 主链路（推荐）

在登录/回调成功链路中，尝试用用户自己的 `secondmeAccessToken` 调用分身 API Key 创建接口：
- 请求分身列表
- 选择/确认目标分身
- 创建（或获取）该分身 API Key
- 将 `secretKey` 保存到 `User.secondmeApiKey`

这样每个用户都是“自己的 token -> 自己的分身 key”，不会串号。

### 2.3 兜底链路（懒同步）

如果登录时没拿到 key（比如权限不足、接口临时失败），不阻塞登录。  
在首次聊天前再次尝试同步：
- 条件：`secondmeAccessToken` 存在且 `secondmeApiKey` 为空
- 行为：再跑一次 key 同步
- 成功后写回库

### 2.4 后台补偿链路（批处理）

提供脚本按条件补齐缺失 key（例如 `secondmeApiKey is null` 且 token 有效）：
- 文件：`/Users/wangzaiwng/Desktop/销售模拟器/backend/src/scripts/syncSecondMeAvatarKeys.ts`

这条链路用于运维阶段修复历史数据，不影响实时聊天体验。

## 3. 连续上下文策略（会话稳定）

我们采用 visitor-chat 的会话模型，不再每句重建：

1. 会话键：`npcId + visitorId`
2. 首次：`visitor-chat/init` 获取 `sessionId + wsUrl`
3. 后续：复用该 `sessionId` 调 `visitor-chat/send`
4. 会话失效（如 timeout / session_not_found）：自动重建一次并重试一次
5. `send` 时只发“用户当前原句”，不拼整段历史，避免污染语义

## 4. 记忆策略（短期 + 长期）

1. 原始聊天记录按用户与 NPC 维度保存。
2. 每 10 句生成一次摘要，作为 `memory-summary` 持久化。
3. 有条件时把摘要同步到 SecondMe Note（best-effort，不阻塞主流程）。

这样做的结果是：
- 当前会话靠 `sessionId` 连续
- 跨会话靠摘要记忆延续

## 5. 回复兜底策略（永远有响应）

优先级：
1. visitor-chat（有 `secondmeApiKey`）
2. direct chat（stream）
3. 本地模板回复

任何上游失败都不会直接让前端“空白无回复”。

## 6. 安全与边界

1. `SECONDME_CLIENT_SECRET` 仅后端持有，前端绝不暴露。
2. 前端只使用 `NEXT_PUBLIC_SECONDME_CLIENT_ID` + redirect 参数发起 OAuth。
3. 数据库存 `secondmeAccessToken` / `secondmeApiKey` 时走最小披露策略（日志脱敏）。
4. CORS 严格按线上域名白名单。

## 7. 对外可复述的一句话

我们采用“用户 OAuth 身份 + 用户分身 API Key + 会话复用 + 失败兜底 + 10 句记忆提炼”的组合策略，保证每位玩家和分身对话都是独立、连续、可恢复、可扩展的。

