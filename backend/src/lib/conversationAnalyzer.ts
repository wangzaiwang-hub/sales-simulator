// 对话质量分析器

export type ConversationQuality = {
  score: number; // 0-100，对话质量分数
  topicMatch: boolean; // 是否匹配NPC兴趣
  depth: 'shallow' | 'medium' | 'deep'; // 对话深度
  sentiment: 'positive' | 'neutral' | 'negative'; // 情感倾向
  engagement: number; // 0-100，参与度
};

// 分析对话质量
export function analyzeConversation(
  userMessage: string,
  npcReply: string,
  npcInterests: string[],
  npcProfession?: string
): ConversationQuality {
  const userLower = userMessage.toLowerCase();
  const replyLower = npcReply.toLowerCase();
  
  // 1. 检查话题匹配度
  const topicMatch = checkTopicMatch(userLower, npcInterests, npcProfession);
  
  // 2. 分析对话深度
  const depth = analyzeDepth(userMessage, npcReply);
  
  // 3. 分析情感倾向
  const sentiment = analyzeSentiment(userMessage, npcReply);
  
  // 4. 计算参与度
  const engagement = calculateEngagement(userMessage, npcReply);
  
  // 5. 计算总分
  let score = 50; // 基础分
  
  // 话题匹配加分
  if (topicMatch) {
    score += 15;
  }
  
  // 深度加分
  if (depth === 'deep') {
    score += 15;
  } else if (depth === 'medium') {
    score += 8;
  }
  
  // 情感加分/减分
  if (sentiment === 'positive') {
    score += 10;
  } else if (sentiment === 'negative') {
    score -= 15;
  }
  
  // 参与度影响
  score += (engagement - 50) / 5; // -10 到 +10
  
  // 确保在0-100范围内
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    topicMatch,
    depth,
    sentiment,
    engagement,
  };
}

// 检查话题是否匹配NPC兴趣
function checkTopicMatch(
  message: string,
  interests: string[],
  profession?: string
): boolean {
  const keywords = [...interests];
  if (profession) {
    keywords.push(profession);
  }
  
  // 扩展关键词（添加相关词）
  const expandedKeywords = expandKeywords(keywords);
  
  // 检查消息中是否包含相关关键词
  return expandedKeywords.some(keyword => 
    message.includes(keyword.toLowerCase())
  );
}

// 扩展关键词（添加相关词）
function expandKeywords(keywords: string[]): string[] {
  const expansionMap: Record<string, string[]> = {
    '商业': ['生意', '创业', '公司', '市场', '销售', '营销', '商务'],
    '创作': ['写作', '绘画', '设计', '艺术', '作品', '创意'],
    '科技': ['技术', '编程', '代码', '开发', '软件', '硬件', 'ai', '人工智能'],
    '社交': ['朋友', '聊天', '交流', '社区', '人际', '关系'],
    '探索': ['旅行', '冒险', '发现', '新鲜', '体验', '尝试'],
    '游戏': ['玩', '娱乐', '游戏', '电竞', '竞技'],
    '故事': ['小说', '叙事', '情节', '角色', '剧情'],
    '设计': ['ui', 'ux', '界面', '视觉', '美学', '排版'],
    '创作者': ['创作', '作品', '内容', '创意'],
    '设计师': ['设计', '美学', '视觉', '创意'],
    '独立开发者': ['开发', '编程', '项目', '产品'],
    '产品经理': ['产品', '需求', '用户', '功能'],
    '研究员': ['研究', '学术', '论文', '实验'],
    '讲述者': ['故事', '叙事', '分享', '表达'],
  };
  
  const expanded = new Set(keywords);
  
  keywords.forEach(keyword => {
    const related = expansionMap[keyword];
    if (related) {
      related.forEach(word => expanded.add(word));
    }
  });
  
  return Array.from(expanded);
}

// 分析对话深度
function analyzeDepth(userMessage: string, npcReply: string): 'shallow' | 'medium' | 'deep' {
  const userLength = userMessage.length;
  const replyLength = npcReply.length;
  const totalLength = userLength + replyLength;
  
  // 检查是否有深度词汇
  const deepWords = [
    '为什么', '怎么', '如何', '原因', '想法', '观点', '看法', '理解',
    '感觉', '认为', '觉得', '经验', '故事', '分享', '详细', '具体',
    '深入', '探讨', '讨论', '思考', '反思'
  ];
  
  const hasDeepWords = deepWords.some(word => 
    userMessage.includes(word) || npcReply.includes(word)
  );
  
  // 检查是否有问句
  const hasQuestion = userMessage.includes('?') || userMessage.includes('？') ||
                     userMessage.includes('吗') || userMessage.includes('呢');
  
  // 判断深度
  if (totalLength > 100 && hasDeepWords && hasQuestion) {
    return 'deep';
  } else if (totalLength > 40 || hasDeepWords || hasQuestion) {
    return 'medium';
  } else {
    return 'shallow';
  }
}

// 分析情感倾向
function analyzeSentiment(userMessage: string, npcReply: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    '好', '棒', '赞', '喜欢', '开心', '高兴', '快乐', '有趣', '精彩',
    '优秀', '厉害', '不错', '感谢', '谢谢', '哈哈', '😊', '😄', '👍',
    '同意', '支持', '认同', '理解', '欣赏', '佩服'
  ];
  
  const negativeWords = [
    '不好', '差', '烂', '讨厌', '无聊', '糟糕', '失望', '生气', '愤怒',
    '垃圾', '傻', '笨', '蠢', '😠', '😡', '👎', '反对', '不同意',
    '不理解', '不喜欢', '讨厌', '烦'
  ];
  
  const combined = userMessage + npcReply;
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (combined.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (combined.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount && positiveCount > 0) {
    return 'positive';
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

// 计算参与度
function calculateEngagement(userMessage: string, npcReply: string): number {
  let score = 50; // 基础分
  
  // 用户消息长度影响
  const userLength = userMessage.length;
  if (userLength > 50) {
    score += 15;
  } else if (userLength > 20) {
    score += 8;
  } else if (userLength < 5) {
    score -= 10;
  }
  
  // NPC回复长度影响（回复越长说明越投入）
  const replyLength = npcReply.length;
  if (replyLength > 100) {
    score += 15;
  } else if (replyLength > 50) {
    score += 8;
  } else if (replyLength < 20) {
    score -= 10;
  }
  
  // 检查是否有互动词汇
  const interactionWords = ['你', '我', '我们', '一起', '觉得', '认为', '想'];
  const hasInteraction = interactionWords.some(word => 
    userMessage.includes(word) || npcReply.includes(word)
  );
  
  if (hasInteraction) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// 根据对话质量调整好感度变化
export function calculateAffinityChangeFromQuality(
  quality: ConversationQuality,
  currentAffinity: number,
  npcAgreeableness: number
): number {
  // 基础变化值（基于对话质量分数）
  let change = (quality.score - 50) / 10; // -5 到 +5
  
  // 话题匹配大幅加分
  if (quality.topicMatch) {
    change += 3;
  }
  
  // 深度对话加分
  if (quality.depth === 'deep') {
    change += 2;
  } else if (quality.depth === 'medium') {
    change += 1;
  }
  
  // 情感影响
  if (quality.sentiment === 'positive') {
    change += 2;
  } else if (quality.sentiment === 'negative') {
    change -= 3;
  }
  
  // 宜人性影响（宜人性高的人更容易增加好感）
  if (npcAgreeableness > 60) {
    change *= 1.2;
  } else if (npcAgreeableness < 40) {
    change *= 0.8;
  }
  
  // 边际效应递减
  if (currentAffinity > 50 && change > 0) {
    change *= 0.6;
  } else if (currentAffinity < -30 && change > 0) {
    change *= 0.4;
  }
  
  // 确保最小变化（避免完全不变）
  if (Math.abs(change) < 0.5) {
    change = quality.topicMatch ? 1 : 0.5;
  }
  
  return Math.round(change * 10) / 10; // 保留一位小数
}

// 生成对话质量反馈（用于调试）
export function getQualityFeedback(quality: ConversationQuality): string {
  const parts: string[] = [];
  
  if (quality.topicMatch) {
    parts.push('话题匹配');
  }
  
  if (quality.depth === 'deep') {
    parts.push('深度对话');
  } else if (quality.depth === 'medium') {
    parts.push('中等深度');
  }
  
  if (quality.sentiment === 'positive') {
    parts.push('积极情感');
  } else if (quality.sentiment === 'negative') {
    parts.push('消极情感');
  }
  
  if (quality.engagement > 70) {
    parts.push('高参与度');
  } else if (quality.engagement < 40) {
    parts.push('低参与度');
  }
  
  return parts.length > 0 ? parts.join(', ') : '普通对话';
}
