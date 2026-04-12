// AI驱动的NPC状态系统
// NPC的心情和活动状态由AI自己决定

export type AIStateUpdateResult = {
  currentMood: string; // AI自定义的心情描述
  activityStatus: string; // AI自定义的活动状态
  reasoning: string; // AI的思考过程
};

// 构建AI状态更新提示词
export function buildStateUpdatePrompt(
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
  recentEvents?: string[] // 最近发生的事情
): string {
  const { profession, interests, personaSummary, personalityTraits } = npcPersonality;
  
  // 解析性格特征
  let traits = personalityTraits;
  if (typeof traits === 'string') {
    try {
      traits = JSON.parse(traits);
    } catch {
      traits = null;
    }
  }
  
  const prompt = `你是${npcName}，一个真实的人。请根据你的性格和最近的经历，描述你现在的心情和正在做什么。

【你的背景】
- 职业：${profession || '未知'}
- 兴趣：${interests?.join('、') || '未知'}
- 个人简介：${personaSummary || '无'}
${traits ? `- 性格特征：
  * 外向性：${traits.extraversion}/100 ${traits.extraversion > 60 ? '(外向)' : traits.extraversion < 40 ? '(内向)' : '(适中)'}
  * 宜人性：${traits.agreeableness}/100 ${traits.agreeableness > 60 ? '(友善)' : traits.agreeableness < 40 ? '(直率)' : '(适中)'}
  * 开放性：${traits.openness}/100 ${traits.openness > 60 ? '(开放)' : traits.openness < 40 ? '(保守)' : '(适中)'}
  * 尽责性：${traits.conscientiousness}/100 ${traits.conscientiousness > 60 ? '(认真)' : traits.conscientiousness < 40 ? '(随性)' : '(适中)'}
  * 神经质：${traits.neuroticism}/100 ${traits.neuroticism > 60 ? '(敏感)' : traits.neuroticism < 40 ? '(稳定)' : '(适中)'}` : ''}

【当前状态】
- 心情：${currentState.currentMood || '未知'}
- 正在做：${currentState.activityStatus || '未知'}

${recentEvents && recentEvents.length > 0 ? `【最近发生的事】
${recentEvents.map((event, i) => `${i + 1}. ${event}`).join('\n')}` : ''}

【任务】
请以${npcName}的视角，真实地描述你现在的状态：

1. 你现在的心情如何？
   - 用简短的词语描述（2-4个字）
   - 可以是：开心、平静、专注、疲惫、兴奋、思考中、有点累、充满活力、放松、忙碌、沉思、愉快、困惑、满足、期待等
   - 或者你自己创造的任何真实的心情描述

2. 你现在在做什么？
   - 用简短的词语描述（2-5个字）
   - 可以是：工作中、休息、闲逛、创作、学习、思考、聊天、发呆、看书、听音乐、做计划、整理东西等
   - 或者你自己创造的任何真实的活动描述

3. 为什么是这个状态？
   - 简单解释一下你的想法（1-2句话）

请用JSON格式回复（只返回JSON，不要其他文字）：
{
  "currentMood": "你的心情（2-4个字）",
  "activityStatus": "你在做什么（2-5个字）",
  "reasoning": "为什么是这个状态（1-2句话）"
}

示例1（外向开朗的创作者）：
{
  "currentMood": "充满灵感",
  "activityStatus": "构思新作品",
  "reasoning": "我最近有很多创作想法，迫不及待想把它们实现出来。"
}

示例2（内向的程序员）：
{
  "currentMood": "专注平静",
  "activityStatus": "写代码",
  "reasoning": "我喜欢沉浸在代码的世界里，这让我感到充实。"
}

示例3（疲惫的上班族）：
{
  "currentMood": "有点累",
  "activityStatus": "喝咖啡休息",
  "reasoning": "工作了一上午，需要休息一下恢复精力。"
}

请根据你的性格和情况，给出真实的状态描述。`;

  return prompt;
}

// 调用SecondMe API更新状态
export async function updateStateWithAI(
  prompt: string,
  secondmeAccessToken?: string | null
): Promise<AIStateUpdateResult | null> {
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
        systemPrompt: '你是一个真实的人，请描述你现在的状态。',
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error('SecondMe AI state update failed:', response.status, raw);
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

    return {
      currentMood: String(result.currentMood || '平静'),
      activityStatus: String(result.activityStatus || '闲逛'),
      reasoning: String(result.reasoning || ''),
    };
  } catch (error) {
    console.error('AI state update error:', error);
    return null;
  }
}

// 回退方案：基于性格的简单状态
export function fallbackStateUpdate(
  npcTraits: any,
  currentMood?: string
): AIStateUpdateResult {
  let traits = npcTraits;
  if (typeof traits === 'string') {
    try {
      traits = JSON.parse(traits);
    } catch {
      traits = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 };
    }
  }

  // 根据性格特征生成状态
  const moods = ['平静', '专注', '愉快', '思考中'];
  const activities = ['闲逛', '思考', '休息', '工作中'];

  // 外向的人更可能是愉快和社交
  if (traits.extraversion > 60) {
    moods.push('充满活力', '开心');
    activities.push('找人聊天', '四处看看');
  }

  // 尽责的人更可能在工作
  if (traits.conscientiousness > 60) {
    moods.push('专注', '认真');
    activities.push('工作中', '做计划');
  }

  // 开放的人更可能在创作或学习
  if (traits.openness > 60) {
    moods.push('充满灵感', '好奇');
    activities.push('创作', '学习新东西');
  }

  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];

  return {
    currentMood: randomMood,
    activityStatus: randomActivity,
    reasoning: '根据性格特征生成的状态',
  };
}

// 定期更新NPC状态（可以在后台任务中调用）
export async function periodicStateUpdate(
  npcId: string,
  npcData: {
    username: string;
    profession?: string;
    interests?: string[];
    personaSummary?: string;
    personalityTraits?: any;
    currentMood?: string;
    activityStatus?: string;
    secondmeAccessToken?: string;
  }
): Promise<AIStateUpdateResult | null> {
  const prompt = buildStateUpdatePrompt(
    npcData.username,
    {
      profession: npcData.profession,
      interests: npcData.interests,
      personaSummary: npcData.personaSummary,
      personalityTraits: npcData.personalityTraits,
    },
    {
      currentMood: npcData.currentMood,
      activityStatus: npcData.activityStatus,
    }
  );

  // 尝试使用AI更新
  let result = await updateStateWithAI(prompt, npcData.secondmeAccessToken);

  // 如果AI失败，使用回退方案
  if (!result) {
    result = fallbackStateUpdate(npcData.personalityTraits, npcData.currentMood);
  }

  return result;
}
