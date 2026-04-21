// AI驱动的NPC状态系统
// NPC的心情和活动状态由AI自己决定

export type AIStateUpdateResult = {
  currentMood: string; // AI自定义的心情描述
  activityStatus: string; // AI自定义的活动状态
  moodReason: string; // 为什么是这个心情
  activityDetail: string; // 具体在做什么
  recentStatusEvent: string; // 最近触发状态变化的事件
  reasoning: string; // AI的思考过程
};

function normalizeActivityStatusKey(status?: string) {
  const value = (status || '').trim().toLowerCase();

  if (/working|工作|写|做|改|整理|处理|画|创作|备课|调试|编/.test(value)) return 'working';
  if (/rest|休息|发呆|缓|喝咖啡|躺|歇/.test(value)) return 'resting';
  if (/busy|忙|赶|处理事情|排期/.test(value)) return 'busy';
  if (/chat|聊|交流|说话/.test(value)) return 'chatting';
  if (/laugh|笑|开心聊/.test(value)) return 'laughing';
  if (/argu|吵|火大|对线/.test(value)) return 'arguing';
  if (/ponder|沉思|琢磨/.test(value)) return 'pondering';
  if (/think|想|思考|盘/.test(value)) return 'thinking';
  return 'idle';
}

function buildFallbackStatusDetails(
  profession?: string,
  interests: string[] = [],
  currentMood?: string,
) {
  const workTopic =
    profession?.includes('设计') ? '改一版视觉稿' :
    profession?.includes('开发') ? '修一个小功能' :
    profession?.includes('产品') ? '顺需求备注' :
    profession?.includes('研究') ? '看资料做摘录' :
    profession?.includes('创作者') ? '磨一段文案' :
    profession ? `处理${profession}的事` :
    interests[0] ? `折腾${interests[0]}的小事` :
    '理一下手头的小事';

  const detail =
    /累|困|疲/.test(currentMood || '') ? '先坐下来缓口气' :
    /烦|焦虑|闷/.test(currentMood || '') ? `边走边想${workTopic}` :
    workTopic;

  const moodReason =
    /累|困|疲/.test(currentMood || '') ? '刚刚连着忙了一阵，脑子和腿都有点发空，想先歇一下。' :
    /烦|焦虑|闷/.test(currentMood || '') ? '手头这点事还没完全理顺，所以心里有点绷着。' :
    /开心|高兴|轻松/.test(currentMood || '') ? '刚把一件小事处理顺了，心里松快了不少。' :
    `我这会儿主要在忙${detail}，所以注意力都在这上面。`;

  return {
    activityDetail: detail,
    moodReason,
    recentStatusEvent: `刚刚一直在${detail}`,
  };
}

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
    moodReason?: string;
    activityDetail?: string;
    recentStatusEvent?: string;
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
- 心情原因：${currentState.moodReason || '还没有明确整理出来'}
- 手头细节：${currentState.activityDetail || '暂时没有具体描述'}
- 最近触发事件：${currentState.recentStatusEvent || '没有特别大的事'}

${recentEvents && recentEvents.length > 0 ? `【最近发生的事】
${recentEvents.map((event, i) => `${i + 1}. ${event}`).join('\n')}` : ''}

【任务】
请以${npcName}的视角，真实地描述你现在的状态：

1. 你现在的心情如何？
   - 用简短自然的词语描述（2-6个字）
   - 要像真人此刻真的会说出来的状态，例如：有点烦、松了口气、还挺开心、脑子很乱、懒洋洋的、提不起劲、挺踏实

2. 你现在在做什么？
   - 先给一个状态类别 activityStatus，只能从下面选一个：
     idle / thinking / busy / chatting / working / resting / arguing / laughing / pondering
   - 再给一个 activityDetail，用自然中文描述你此刻具体在做什么（6-16个字）
   - activityDetail 要具体到能回答“你现在在忙什么”

3. 为什么是这个状态？
   - 用 moodReason 说清楚为什么会是这个心情（1-2句话）
   - 不是重复心情词，而是说出事情和原因

4. 最近触发你这个状态的事是什么？
   - 用 recentStatusEvent 写一句刚刚发生的小事
   - 让人一问你“怎么了”，你能顺着说下去

请用JSON格式回复（只返回JSON，不要其他文字）：
{
  "currentMood": "你的心情（2-6个字）",
  "activityStatus": "idle|thinking|busy|chatting|working|resting|arguing|laughing|pondering 之一",
  "activityDetail": "你在做什么（6-16个字）",
  "moodReason": "为什么是这个心情（1-2句话）",
  "recentStatusEvent": "最近触发状态的小事（1句话）",
  "reasoning": "你对自己当前状态的内心解释（1-2句话）"
}

示例1（外向开朗的创作者）：
{
  "currentMood": "充满灵感",
  "activityStatus": "working",
  "activityDetail": "在补一段新文案",
  "moodReason": "刚刚冒出来一个顺手的点子，我怕一会儿就忘了，所以整个人都兴奋起来了。",
  "recentStatusEvent": "刚在路上想到一句特别顺的开头",
  "reasoning": "脑子里有东西在往外冒，我现在就想赶紧把它记下来。"
}

示例2（内向的程序员）：
{
  "currentMood": "专注平静",
  "activityStatus": "working",
  "activityDetail": "在改一个小功能",
  "moodReason": "这块逻辑刚理顺，做起来还算顺手，所以人也慢慢静下来了。",
  "recentStatusEvent": "刚把卡住的思路捋通了",
  "reasoning": "我现在适合一口气把这段做完，不太想被打断。"
}

示例3（疲惫的上班族）：
{
  "currentMood": "有点累",
  "activityStatus": "resting",
  "activityDetail": "坐着喝口水缓缓",
  "moodReason": "刚刚一直没停，腿和脑子都绷着，现在只想先喘口气。",
  "recentStatusEvent": "前面连着忙了一阵没顾上休息",
  "reasoning": "我不是故意消极，只是身体在提醒我该停一下了。"
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
      activityStatus: normalizeActivityStatusKey(String(result.activityStatus || result.activityDetail || 'idle')),
      activityDetail: String(result.activityDetail || '在附近随便走走'),
      moodReason: String(result.moodReason || result.reasoning || ''),
      recentStatusEvent: String(result.recentStatusEvent || ''),
      reasoning: String(result.reasoning || result.moodReason || ''),
    };
  } catch (error) {
    console.error('AI state update error:', error);
    return null;
  }
}

// 回退方案：基于性格的简单状态
export function fallbackStateUpdate(
  npcTraits: any,
  currentMood?: string,
  context?: {
    profession?: string;
    interests?: string[];
    currentActivityDetail?: string;
  },
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
  const activities = ['idle', 'thinking', 'resting', 'working'];

  // 外向的人更可能是愉快和社交
  if (traits.extraversion > 60) {
    moods.push('充满活力', '开心');
    activities.push('chatting', 'idle');
  }

  // 尽责的人更可能在工作
  if (traits.conscientiousness > 60) {
    moods.push('专注', '认真');
    activities.push('working', 'busy');
  }

  // 开放的人更可能在创作或学习
  if (traits.openness > 60) {
    moods.push('充满灵感', '好奇');
    activities.push('working', 'thinking');
  }

  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  const randomActivity = normalizeActivityStatusKey(activities[Math.floor(Math.random() * activities.length)]);
  const details = buildFallbackStatusDetails(context?.profession, context?.interests, currentMood || randomMood);

  return {
    currentMood: randomMood,
    activityStatus: randomActivity,
    activityDetail: context?.currentActivityDetail || details.activityDetail,
    moodReason: details.moodReason,
    recentStatusEvent: details.recentStatusEvent,
    reasoning: '根据性格特征和当前节奏推断出的状态。',
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
