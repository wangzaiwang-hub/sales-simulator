/**
 * 智能上下文管理系统
 * 负责管理对话历史，保留核心内容，丢弃不必要的信息
 */

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  importance?: number; // 0-100，重要性评分
};

export type ContextWindow = {
  messages: Message[];
  totalTokens: number;
  summary?: string;
};

/**
 * 估算消息的token数量（粗略估算：中文1字≈1.5token，英文1词≈1.3token）
 */
function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const others = text.length - chineseChars - englishWords;
  
  return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + others * 0.5);
}

/**
 * 评估消息的重要性
 */
function evaluateImportance(message: Message, index: number, total: number): number {
  let score = 50; // 基础分
  
  // 1. 位置权重：最近的消息更重要
  const recencyScore = (index / total) * 30;
  score += recencyScore;
  
  // 2. 长度权重：较长的消息可能包含更多信息
  const length = message.content.length;
  if (length > 100) score += 10;
  if (length > 200) score += 5;
  
  // 3. 内容特征：包含关键词的消息更重要
  const keywords = [
    '名字', '职业', '兴趣', '爱好', '家人', '朋友',
    '重要', '记住', '一定', '必须', '承诺', '约定',
    '喜欢', '讨厌', '害怕', '梦想', '目标',
    '秘密', '隐私', '感情', '关系'
  ];
  
  const hasKeyword = keywords.some(kw => message.content.includes(kw));
  if (hasKeyword) score += 15;
  
  // 4. 问答对：问题和回答都很重要
  if (message.content.includes('?') || message.content.includes('？')) {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * 生成对话摘要
 */
async function generateSummary(messages: Message[], aiToken?: string): Promise<string> {
  // 如果没有AI token，使用简单的摘要方法
  if (!aiToken || messages.length === 0) {
    return generateSimpleSummary(messages);
  }
  
  // TODO: 使用AI生成更智能的摘要
  // 这里可以调用SecondMe或其他AI服务
  return generateSimpleSummary(messages);
}

/**
 * 简单摘要生成（不依赖AI）
 */
function generateSimpleSummary(messages: Message[]): string {
  if (messages.length === 0) return '';
  
  const keyPoints: string[] = [];
  
  // 提取关键信息
  messages.forEach(msg => {
    // 提取自我介绍
    if (msg.content.match(/我(是|叫|名字).{1,20}/)) {
      const match = msg.content.match(/我(是|叫|名字是?)[^，。！？\n]{1,20}/);
      if (match) keyPoints.push(match[0]);
    }
    
    // 提取职业信息
    if (msg.content.match(/职业|工作|做.{1,10}的/)) {
      const match = msg.content.match(/(职业|工作)是?[^，。！？\n]{1,20}/);
      if (match) keyPoints.push(match[0]);
    }
    
    // 提取兴趣爱好
    if (msg.content.match(/喜欢|爱好|兴趣/)) {
      const match = msg.content.match(/(喜欢|爱好|兴趣)[^，。！？\n]{1,30}/);
      if (match) keyPoints.push(match[0]);
    }
  });
  
  if (keyPoints.length === 0) {
    return `之前聊了${messages.length}条消息`;
  }
  
  return `之前的对话要点：${keyPoints.slice(0, 3).join('；')}`;
}

/**
 * 压缩上下文：保留重要信息，丢弃不重要的
 */
export async function compressContext(
  messages: Message[],
  maxTokens: number = 2000,
  aiToken?: string
): Promise<ContextWindow> {
  if (messages.length === 0) {
    return { messages: [], totalTokens: 0 };
  }
  
  // 1. 计算每条消息的重要性
  const messagesWithScore = messages.map((msg, idx) => ({
    ...msg,
    importance: msg.importance || evaluateImportance(msg, idx, messages.length),
    tokens: estimateTokens(msg.content),
  }));
  
  // 2. 计算总token数
  let totalTokens = messagesWithScore.reduce((sum, msg) => sum + msg.tokens, 0);
  
  // 3. 如果没超过限制，直接返回
  if (totalTokens <= maxTokens) {
    return {
      messages: messagesWithScore,
      totalTokens,
    };
  }
  
  // 4. 需要压缩：保留最重要的消息
  // 策略：
  // - 始终保留最近的N条消息（保证连贯性）
  // - 从旧消息中选择重要的保留
  // - 生成摘要替代被丢弃的消息
  
  const recentCount = Math.min(6, messages.length); // 保留最近6条
  const recentMessages = messagesWithScore.slice(-recentCount);
  const olderMessages = messagesWithScore.slice(0, -recentCount);
  
  // 计算最近消息的token数
  const recentTokens = recentMessages.reduce((sum, msg) => sum + msg.tokens, 0);
  const remainingTokens = maxTokens - recentTokens - 200; // 预留200给摘要
  
  // 从旧消息中选择重要的
  const selectedOlder: typeof messagesWithScore = [];
  let olderTokens = 0;
  
  // 按重要性排序
  const sortedOlder = [...olderMessages].sort((a, b) => b.importance! - a.importance!);
  
  for (const msg of sortedOlder) {
    if (olderTokens + msg.tokens <= remainingTokens) {
      selectedOlder.push(msg);
      olderTokens += msg.tokens;
    }
  }
  
  // 按时间顺序重新排列
  selectedOlder.sort((a, b) => {
    const aIdx = messagesWithScore.indexOf(a);
    const bIdx = messagesWithScore.indexOf(b);
    return aIdx - bIdx;
  });
  
  // 5. 生成被丢弃消息的摘要
  const droppedMessages = olderMessages.filter(msg => !selectedOlder.includes(msg));
  let summary = '';
  
  if (droppedMessages.length > 0) {
    summary = await generateSummary(droppedMessages, aiToken);
  }
  
  // 6. 组合最终上下文
  const finalMessages: Message[] = [];
  
  if (summary) {
    finalMessages.push({
      role: 'system',
      content: `[历史对话摘要] ${summary}`,
    });
  }
  
  finalMessages.push(...selectedOlder);
  finalMessages.push(...recentMessages);
  
  totalTokens = finalMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  
  return {
    messages: finalMessages,
    totalTokens,
    summary,
  };
}

/**
 * 从数据库聊天记录构建上下文
 */
export function buildContextFromHistory(
  chatHistory: Array<{
    role: string;
    content: string;
    createdAt: string;
  }>,
  maxMessages: number = 20
): Message[] {
  // 只取最近的N条消息
  const recentHistory = chatHistory.slice(-maxMessages);
  
  return recentHistory.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: msg.createdAt,
  }));
}

/**
 * 构建完整的对话上下文（包括系统提示）
 */
export async function buildFullContext(
  systemPrompt: string,
  chatHistory: Message[],
  currentMessage: string,
  maxTokens: number = 2000,
  aiToken?: string
): Promise<Message[]> {
  // 1. 压缩历史对话
  const compressed = await compressContext(chatHistory, maxTokens - 500, aiToken);
  
  // 2. 构建完整上下文
  const context: Message[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...compressed.messages,
    {
      role: 'user',
      content: currentMessage,
    },
  ];
  
  return context;
}
