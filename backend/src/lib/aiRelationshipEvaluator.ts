// AI驱动的关系评估系统

export type AIEvaluationResult = {
  affinityChange: number; // -10 到 +10
  familiarityChange: number; // 0 到 +10，AI自己评判
  newMood: string; // AI自定义的心情描述
  newActivityStatus: string; // AI自定义的活动状态
  reasoning: string; // AI的评判理由
  emotionalResponse: string; // 情绪反应描述
};

function isGreetingMessage(message: string) {
  return /^(你好|您好|嗨|哈喽|hello|hi|早上好|中午好|晚上好|在吗)[!！,.，。?？~～\s]*$/i.test(message.trim());
}

function getMoodAffinityBias(currentMood: string) {
  const mood = (currentMood || '').trim().toLowerCase();

  if (/happy|excited|开心|兴奋|期待|愉快|高兴/.test(mood)) {
    return 1;
  }

  if (/angry|sad|anxious|烦|焦虑|生气|难过|低落|疲惫|有点累|累/.test(mood)) {
    return -2;
  }

  return 0;
}

function getMessageAffinitySignal(userMessage: string, npcInterests: string[]) {
  const message = userMessage.trim();
  const lower = message.toLowerCase();

  let score = 0;

  if (isGreetingMessage(message)) score += 1;
  if (message.length > 12) score += 1;
  if (message.length > 28) score += 1;

  const topicMatch = npcInterests.some((interest) => lower.includes(String(interest).toLowerCase()));
  if (topicMatch) score += 2;

  if (/(关心|怎么了|咋了|辛苦|累不累|还好吗|心情|陪你|找你玩|别难过|抱抱)/.test(message)) {
    score += 2;
  }

  if (/(谢谢|感谢|喜欢|棒|真好|开心|有趣|可爱|厉害)/.test(message)) {
    score += 2;
  }

  if (/(讨厌|滚|闭嘴|有病|傻|笨|烦死|无聊|差劲)/.test(message)) {
    score -= 4;
  } else if (/(不好|不行|算了|没意思|无语|一般般)/.test(message)) {
    score -= 2;
  }

  return Math.max(-6, Math.min(6, score));
}

function getRelationalTone(userMessage: string) {
  const message = userMessage.trim();

  const caring =
    /(关心|怎么了|咋了|辛苦|累不累|还好吗|心情|陪你|找你玩|别难过|抱抱|心疼|照顾|休息|别太累|揉揉|给你揉|陪你聊|哄你)/.test(
      message,
    );
  const flirty =
    /(在我心里|土味情话|想你|喜欢你|撩|亲亲|抱抱|宝贝|宝宝|你真甜|你真可爱|你最好看|月亮不睡|星星|心都化了|为你|只对你)/.test(
      message,
    );
  const hostile = /(讨厌|滚|闭嘴|有病|傻|笨|烦死|无聊|差劲)/.test(message);

  return { caring, flirty, hostile };
}

function rebalanceFamiliarityChange(
  rawFamiliarityChange: number,
  userMessage: string,
  npcInterests: string[],
) {
  const message = userMessage.trim();
  const topicMatch = npcInterests.some((interest) => message.toLowerCase().includes(String(interest).toLowerCase()));
  const { caring, flirty } = getRelationalTone(message);

  let nextFamiliarityChange = rawFamiliarityChange;

  if (message.length > 18) nextFamiliarityChange += 1;
  if (message.length > 36) nextFamiliarityChange += 1;
  if (topicMatch) nextFamiliarityChange += 1;
  if (caring) nextFamiliarityChange += 2;
  if (flirty) nextFamiliarityChange += 2;

  return Math.max(1, Math.min(8, nextFamiliarityChange));
}

export function rebalanceAffinityChange(
  rawAffinityChange: number,
  userMessage: string,
  npcInterests: string[],
  currentMood: string,
) {
  const messageSignal = getMessageAffinitySignal(userMessage, npcInterests);
  const moodBias = getMoodAffinityBias(currentMood);
  const { caring, flirty, hostile } = getRelationalTone(userMessage);
  const messageDrivenScore = rawAffinityChange * 0.25 + messageSignal * 0.75;

  let nextAffinityChange = Math.round(messageDrivenScore * 0.7 + moodBias * 0.3);

  if (isGreetingMessage(userMessage) && nextAffinityChange < 0) {
    nextAffinityChange = 0;
  }

  if (!hostile && caring && nextAffinityChange < 2) {
    nextAffinityChange = 2;
  }

  if (!hostile && flirty && nextAffinityChange < 3) {
    nextAffinityChange = 3;
  }

  return Math.max(-8, Math.min(8, nextAffinityChange));
}

// 构建AI评估提示词
export function buildEvaluationPrompt(
  npcName: string,
  npcPersonality: {
    profession?: string;
    interests?: string[];
    personaSummary?: string;
    personalityTraits?: any;
  },
  currentRelationship: {
    affinity: number;
    familiarity: number;
    relationshipType: string;
  },
  currentMood: string,
  userMessage: string,
  npcReply: string
): string {
  const { profession, interests, personaSummary, personalityTraits } = npcPersonality;
  const { affinity, familiarity, relationshipType } = currentRelationship;
  
  // 解析性格特征
  let traits = personalityTraits;
  if (typeof traits === 'string') {
    try {
      traits = JSON.parse(traits);
    } catch {
      traits = null;
    }
  }
  
  const prompt = `你是${npcName}，一个真实的人。请根据这次对话评估你对对方的感受变化。

【你的背景】
- 职业：${profession || '未知'}
- 兴趣：${interests?.join('、') || '未知'}
- 个人简介：${personaSummary || '无'}
${traits ? `- 性格特征：
  * 外向性：${traits.extraversion}/100 ${traits.extraversion > 60 ? '(外向)' : traits.extraversion < 40 ? '(内向)' : '(适中)'}
  * 宜人性：${traits.agreeableness}/100 ${traits.agreeableness > 60 ? '(友善)' : traits.agreeableness < 40 ? '(直率)' : '(适中)'}
  * 开放性：${traits.openness}/100 ${traits.openness > 60 ? '(开放)' : traits.openness < 40 ? '(保守)' : '(适中)'}
  * 神经质：${traits.neuroticism}/100 ${traits.neuroticism > 60 ? '(敏感)' : traits.neuroticism < 40 ? '(稳定)' : '(适中)'}` : ''}

【当前关系】
- 关系类型：${relationshipType}
- 好感度：${affinity}/100 ${getAffinityDescription(affinity)}
- 熟悉度：${familiarity}/100 ${getFamiliarityDescription(familiarity)}
- 当前心情：${currentMood || '平静'}

【对话内容】
对方说："${userMessage}"
你回复："${npcReply}"

【评估任务】
请以${npcName}的视角，真实地评估这次对话：

1. 好感度变化（-10到+10）：
   - 权重按 7:3 处理：70% 看对方这句话本身的内容、态度、是否有关心或共鸣；30% 才看你此刻的心情状态
   - 对方的话让你感觉如何？
   - 是否触及你感兴趣的话题？
   - 对话是否让你感到舒适/不适？
   - 考虑你的性格特征（外向/内向、友善/直率等）
   - 如果对方只是正常礼貌地打招呼，不要一下给明显负分
   - 如果对方明显在关心你、安慰你、逗你开心，或者说了有点暧昧/土味情话，通常应该是正向加分，除非内容冒犯

2. 熟悉度变化（0到+10）：
   - 这次对话让你对对方了解更多了吗？
   - 对话是否有深度和实质内容？
   - 是否分享了个人信息或想法？
   - 简短对话熟悉度增加少（+1到+3）
   - 深入对话熟悉度增加多（+4到+7）
   - 非常深入的对话熟悉度增加很多（+8到+10）

3. 心情变化：
   - 这次对话后你的心情如何？
   - 用简短的词语描述（2-4个字）
   - 例如：开心、兴奋、平静、专注、疲惫、困惑、悲伤、生气、焦虑、愉快、满足、期待等
   - 或者你自己创造的任何真实的心情描述

4. 状态变化：
   - 对话后你想做什么？
   - 用简短的词语描述（2-5个字）
   - 例如：继续聊天、思考、工作、休息、忙碌、闲逛、沉思、大笑、争吵、创作、学习等
   - 或者你自己创造的任何真实的活动描述

请用JSON格式回复（只返回JSON，不要其他文字）：
{
  "affinityChange": 数字（-10到+10），
  "familiarityChange": 数字（0到+10），
  "newMood": "你的心情（2-4个字）",
  "newActivityStatus": "你想做什么（2-5个字）",
  "reasoning": "你的评判理由（1-2句话，第一人称）",
  "emotionalResponse": "你的情绪反应（1句话，描述你的感受）"
}

示例1（简短对话）：
{
  "affinityChange": 1,
  "familiarityChange": 2,
  "newMood": "平静",
  "newActivityStatus": "继续闲逛",
  "reasoning": "普通的寒暄，没什么特别的。",
  "emotionalResponse": "还行吧。"
}

示例2（深入对话）：
{
  "affinityChange": 5,
  "familiarityChange": 6,
  "newMood": "充满期待",
  "newActivityStatus": "继续交流",
  "reasoning": "对方问到了我感兴趣的话题，而且分享了自己的想法，让我对TA有了更多了解。",
  "emotionalResponse": "我感到很开心，想继续聊下去。"
}`;

  return prompt;
}

// 调用SecondMe API进行评估
export async function evaluateWithAI(
  prompt: string,
  secondmeAccessToken?: string | null,
  context?: {
    userMessage?: string;
    npcInterests?: string[];
    currentMood?: string;
  },
): Promise<AIEvaluationResult | null> {
  if (!secondmeAccessToken) {
    return null;
  }

  try {
    const response = await fetch('https://api.mindverse.com/gate/lab/api/secondme/chat/stream', {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secondmeAccessToken}`,
      },
      body: JSON.stringify({
        message: prompt,
        systemPrompt: '你是一个真实的人，请根据对话评估你的感受变化。',
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error('SecondMe AI evaluation failed:', response.status, raw);
      return null;
    }

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
        const data = JSON.parse(payload) as {
          choices?: Array<{
            delta?: { content?: string };
            message?: { content?: string };
          }>;
        };

        const content =
          data.choices?.[0]?.delta?.content ||
          data.choices?.[0]?.message?.content;

        if (content) {
          chunks.push(content);
        }
      } catch {
        // 忽略解析错误
      }
    }

    const content = chunks.join('');

    if (!content) {
      return null;
    }

    // 提取JSON（可能被markdown包裹）
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonStr);

    // 验证和规范化结果
    return {
      affinityChange: rebalanceAffinityChange(
        Math.max(-10, Math.min(10, Number(result.affinityChange) || 0)),
        context?.userMessage || '',
        context?.npcInterests || [],
        context?.currentMood || '',
      ),
      familiarityChange: rebalanceFamiliarityChange(
        Math.max(0, Math.min(10, Number(result.familiarityChange) || 2)),
        context?.userMessage || '',
        context?.npcInterests || [],
      ),
      newMood: String(result.newMood || '平静'),
      newActivityStatus: String(result.newActivityStatus || '闲逛'),
      reasoning: String(result.reasoning || ''),
      emotionalResponse: String(result.emotionalResponse || ''),
    };
  } catch (error) {
    console.error('AI evaluation error:', error);
    return null;
  }
}

// 获取好感度描述
function getAffinityDescription(affinity: number): string {
  if (affinity >= 80) return '(非常喜欢)';
  if (affinity >= 60) return '(很喜欢)';
  if (affinity >= 40) return '(喜欢)';
  if (affinity >= 20) return '(有好感)';
  if (affinity >= 0) return '(普通)';
  if (affinity >= -20) return '(不太喜欢)';
  if (affinity >= -40) return '(不喜欢)';
  if (affinity >= -60) return '(很不喜欢)';
  return '(非常讨厌)';
}

// 获取熟悉度描述
function getFamiliarityDescription(familiarity: number): string {
  if (familiarity >= 80) return '(非常熟悉)';
  if (familiarity >= 60) return '(很熟悉)';
  if (familiarity >= 40) return '(比较熟悉)';
  if (familiarity >= 20) return '(有点熟悉)';
  return '(不太熟)';
}

// 回退方案：基于规则的简单评估
export function fallbackEvaluation(
  userMessage: string,
  npcReply: string,
  npcInterests: string[],
  currentMood: string
): AIEvaluationResult {
  const userLower = userMessage.toLowerCase();
  
  // 检查话题匹配
  const topicMatch = npcInterests.some(interest => 
    userLower.includes(interest.toLowerCase())
  );
  
  // 检查积极词汇
  const positiveWords = ['好', '棒', '赞', '喜欢', '开心', '有趣', '感谢'];
  const hasPositive = positiveWords.some(word => userMessage.includes(word));
  
  // 检查消极词汇
  const negativeWords = ['不好', '差', '烂', '讨厌', '无聊', '糟糕'];
  const hasNegative = negativeWords.some(word => userMessage.includes(word));
  const { caring, flirty } = getRelationalTone(userMessage);
  
  // 先算一个基础分，再按“用户话语 70%，心情状态 30%”重平衡
  let rawAffinityChange = 0;
  if (topicMatch) rawAffinityChange += 2;
  if (hasPositive) rawAffinityChange += 2;
  if (hasNegative) rawAffinityChange -= 3;
  if (userMessage.length > 20) rawAffinityChange += 1;
  const affinityChange = rebalanceAffinityChange(rawAffinityChange, userMessage, npcInterests, currentMood);
  
  // 计算熟悉度变化
  const familiarityChange = rebalanceFamiliarityChange(2, userMessage, npcInterests);
  
  // 确定新心情
  let newMood = currentMood || '平静';
  if (flirty || caring) {
    newMood = '有点心动';
  } else if (hasPositive && topicMatch) {
    newMood = '开心';
  } else if (hasNegative) {
    newMood = '有点失望';
  } else if (topicMatch) {
    newMood = '兴奋';
  }
  
  // 确定新状态
  const newActivityStatus = flirty || caring ? '继续聊天' : topicMatch ? '继续聊天' : '思考中';
  
  return {
    affinityChange,
    familiarityChange,
    newMood,
    newActivityStatus,
    reasoning: flirty || caring ? '对方的话明显带着关心和暧昧，我会更容易对TA有好感。' : topicMatch ? '对方提到了我感兴趣的话题。' : '普通的对话。',
    emotionalResponse: flirty ? '这话听得我有点想笑，也有点被撩到。' : caring ? '能感觉到TA是在认真关心我。' : hasPositive ? '感觉还不错。' : '还行吧。',
  };
}
