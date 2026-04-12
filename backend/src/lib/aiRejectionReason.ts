// AI驱动的拒绝理由生成系统

export type AIRejectionResult = {
  reason: string; // AI生成的拒绝理由
};

// 构建AI拒绝理由提示词
export function buildRejectionPrompt(
  npcName: string,
  npcPersonality: {
    profession?: string;
    interests?: string[];
    personaSummary?: string;
    personalityTraits?: any;
  },
  currentState: {
    currentMood?: string;
    activityStatus?: string;
  },
  rejectionContext: {
    isFirstMeeting: boolean;
    relationshipType?: string;
    reason: 'social_anxiety' | 'introverted' | 'nervous' | 'conservative' | 'bad_mood' | 'busy' | 'tired' | 'unfriendly' | 'enemy' | 'random';
  }
): string {
  const { profession, interests, personaSummary, personalityTraits } = npcPersonality;
  const { currentMood, activityStatus } = currentState;
  const { isFirstMeeting, relationshipType, reason } = rejectionContext;
  
  // 解析性格特征
  let traits = personalityTraits;
  if (typeof traits === 'string') {
    try {
      traits = JSON.parse(traits);
    } catch {
      traits = null;
    }
  }
  
  // 根据拒绝原因生成不同的提示
  const reasonDescriptions: Record<typeof reason, string> = {
    social_anxiety: '你是一个非常内向、社恐的人，不习惯和陌生人说话',
    introverted: '你是一个内向的人，对陌生人比较谨慎',
    nervous: '你是一个敏感、神经质的人，对陌生人有警惕心',
    conservative: '你是一个保守的人，不太喜欢新的社交接触',
    bad_mood: '你现在心情不好，不想和人说话',
    busy: '你现在很忙，没时间聊天',
    tired: '你现在很累，想休息',
    unfriendly: '你不是一个很友善的人，不太想和人聊天',
    enemy: '你和对方关系不好，不想和TA说话',
    random: '你现在不太想聊天',
  };
  
  const prompt = `你是${npcName}，一个真实的人。有人想和你聊天，但你现在不想接受。

【你的背景】
- 职业：${profession || '未知'}
- 兴趣：${interests?.join('、') || '未知'}
- 个人简介：${personaSummary || '无'}
${traits ? `- 性格特征：
  * 外向性：${traits.extraversion}/100 ${traits.extraversion > 60 ? '(外向)' : traits.extraversion < 40 ? '(内向)' : '(适中)'}
  * 宜人性：${traits.agreeableness}/100 ${traits.agreeableness > 60 ? '(友善)' : traits.agreeableness < 40 ? '(直率)' : '(适中)'}
  * 神经质：${traits.neuroticism}/100 ${traits.neuroticism > 60 ? '(敏感)' : traits.neuroticism < 40 ? '(稳定)' : '(适中)'}` : ''}

【当前状态】
- 心情：${currentMood || '平静'}
- 正在做：${activityStatus || '闲逛'}
- 关系：${isFirstMeeting ? '陌生人（第一次见面）' : relationshipType || '陌生人'}

【情况】
${reasonDescriptions[reason]}

【任务】
请以${npcName}的视角，用1-2句话礼貌地拒绝对方的聊天请求。

要求：
1. 要符合你的性格特征
2. 要真实、自然，不要太生硬
3. 可以简短，也可以稍微解释一下原因
4. 不要太冷漠，保持基本的礼貌
5. 根据你的性格，可以直接一点或委婉一点

请直接回复拒绝的话（不要JSON格式，直接说话）：

示例1（内向社恐）：
"不好意思，我不太习惯和陌生人说话..."

示例2（心情不好）：
"抱歉，我现在心情不太好，不想聊天。"

示例3（忙碌）：
"不好意思，我现在有点忙，改天再聊吧。"

示例4（直率不友善）：
"我现在不想聊。"

示例5（敏感警惕）：
"我们好像不认识吧...我有点事要忙。"

请根据你的性格和情况，给出真实的拒绝理由：`;

  return prompt;
}

// 调用SecondMe API生成拒绝理由
export async function generateRejectionWithAI(
  prompt: string,
  secondmeAccessToken?: string | null
): Promise<string | null> {
  if (!secondmeAccessToken) {
    return null;
  }

  try {
    const response = await fetch('https://api.mindverse.com/gate/lab/api/secondme/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secondmeAccessToken}`,
      },
      body: JSON.stringify({
        message: prompt,
        systemPrompt: '你是一个真实的人，请自然地表达你的想法。',
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error('SecondMe AI rejection generation failed:', response.status, raw);
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

    const content = chunks.join('').trim();

    if (!content) {
      return null;
    }

    // 移除可能的引号
    let reason = content;
    if (reason.startsWith('"') && reason.endsWith('"')) {
      reason = reason.slice(1, -1);
    }
    if (reason.startsWith('"') && reason.endsWith('"')) {
      reason = reason.slice(1, -1);
    }

    return reason;
  } catch (error) {
    console.error('AI rejection generation error:', error);
    return null;
  }
}

// 回退方案：基于规则的拒绝理由
export function fallbackRejectionReason(
  reason: 'social_anxiety' | 'introverted' | 'nervous' | 'conservative' | 'bad_mood' | 'busy' | 'tired' | 'unfriendly' | 'enemy' | 'random'
): string {
  const fallbackReasons: Record<typeof reason, string[]> = {
    social_anxiety: [
      '不好意思，我不太习惯和陌生人说话...',
      '抱歉，我有点社恐，不太会聊天...',
    ],
    introverted: [
      '抱歉，我现在不太想聊天。',
      '不好意思，我想一个人待会儿。',
    ],
    nervous: [
      '我们好像不认识吧...',
      '不好意思，我有点事。',
    ],
    conservative: [
      '不好意思，我有点事。',
      '抱歉，我现在不方便。',
    ],
    bad_mood: [
      '我现在心情不太好，不想说话。',
      '抱歉，我现在不太想聊天。',
    ],
    busy: [
      '我现在有点忙，等会儿再说吧。',
      '抱歉，我现在真的很忙。',
    ],
    tired: [
      '我有点累了，想休息一下。',
      '不好意思，我现在有点累。',
    ],
    unfriendly: [
      '不想聊。',
      '我现在不想说话。',
    ],
    enemy: [
      '我不想和你说话。',
      '我们没什么好聊的。',
    ],
    random: [
      '不好意思，我现在不太想聊天。',
      '抱歉，改天再聊吧。',
    ],
  };

  const reasons = fallbackReasons[reason];
  return reasons[Math.floor(Math.random() * reasons.length)];
}
