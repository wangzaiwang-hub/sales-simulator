// NPC情绪和社交系统

export type PersonalityTraits = {
  openness: number; // 开放性 0-100
  conscientiousness: number; // 尽责性 0-100
  extraversion: number; // 外向性 0-100
  agreeableness: number; // 宜人性 0-100
  neuroticism: number; // 神经质 0-100
};

export type Mood = 
  | 'happy' // 开心
  | 'sad' // 悲伤
  | 'angry' // 生气
  | 'excited' // 兴奋
  | 'tired' // 疲惫
  | 'focused' // 专注
  | 'confused' // 困惑
  | 'calm' // 平静
  | 'anxious' // 焦虑
  | 'neutral'; // 中性

export type ActivityStatus =
  | 'idle' // 闲置
  | 'thinking' // 思考中
  | 'busy' // 忙碌
  | 'chatting' // 交流中
  | 'working' // 工作中
  | 'resting' // 休息中
  | 'arguing' // 争吵中
  | 'laughing' // 大笑
  | 'pondering'; // 沉思

export type SocialPreference =
  | 'very_introverted' // 非常内向
  | 'introverted' // 内向
  | 'moderate' // 适中
  | 'extroverted' // 外向
  | 'very_extroverted'; // 非常外向

export type NpcEmotionalState = {
  mood: Mood;
  activityStatus: ActivityStatus;
  socialEnergy: number; // 0-100，社交能量
  stressLevel: number; // 0-100，压力水平
  lastInteractionTime?: number;
  interactingWithNpcId?: string | null;
};

// 根据性格特征计算社交偏好
export function calculateSocialPreference(traits: PersonalityTraits): SocialPreference {
  const { extraversion } = traits;
  
  if (extraversion >= 80) return 'very_extroverted';
  if (extraversion >= 60) return 'extroverted';
  if (extraversion >= 40) return 'moderate';
  if (extraversion >= 20) return 'introverted';
  return 'very_introverted';
}

// 根据性格特征决定是否愿意社交
export function shouldAcceptSocialInteraction(
  traits: PersonalityTraits,
  emotionalState: NpcEmotionalState,
  initiatorTraits?: PersonalityTraits
): { accept: boolean; reason?: string } {
  const { extraversion, agreeableness, neuroticism } = traits;
  const { socialEnergy, stressLevel, mood } = emotionalState;

  // 非常内向且社交能量低
  if (extraversion < 30 && socialEnergy < 30) {
    return { accept: false, reason: '我现在想一个人静静...' };
  }

  // 压力太大
  if (stressLevel > 70) {
    return { accept: false, reason: '抱歉，我现在有点忙...' };
  }

  // 心情不好且神经质高
  if ((mood === 'sad' || mood === 'angry' || mood === 'anxious') && neuroticism > 60) {
    return { accept: false, reason: '我现在心情不太好，改天再聊吧。' };
  }

  // 正在和别人交流
  if (emotionalState.interactingWithNpcId) {
    return { accept: false, reason: '我正在和别人说话呢。' };
  }

  // 宜人性低且随机拒绝
  if (agreeableness < 40 && Math.random() > 0.6) {
    return { accept: false, reason: '不好意思，我不太想聊天。' };
  }

  // 外向且心情好，更容易接受
  if (extraversion > 60 && (mood === 'happy' || mood === 'excited')) {
    return { accept: true };
  }

  // 默认根据外向性和宜人性决定
  const acceptChance = (extraversion + agreeableness) / 200;
  return { accept: Math.random() < acceptChance };
}

// 根据性格特征决定是否主动发起社交
export function shouldInitiateSocialInteraction(
  traits: PersonalityTraits,
  emotionalState: NpcEmotionalState,
  nearbyNpcs: number
): boolean {
  const { extraversion, openness } = traits;
  const { socialEnergy, activityStatus } = emotionalState;

  // 正在忙碌或已经在社交
  if (activityStatus === 'busy' || activityStatus === 'chatting' || activityStatus === 'working') {
    return false;
  }

  // 社交能量低
  if (socialEnergy < 20) {
    return false;
  }

  // 没有附近的NPC
  if (nearbyNpcs === 0) {
    return false;
  }

  // 非常外向的人更容易主动社交
  if (extraversion > 70 && socialEnergy > 50) {
    return Math.random() < 0.3;
  }

  // 外向且开放的人
  if (extraversion > 50 && openness > 50) {
    return Math.random() < 0.15;
  }

  // 适中性格
  if (extraversion > 40) {
    return Math.random() < 0.05;
  }

  return false;
}

// 根据两个NPC的性格决定互动类型
export function determineInteractionType(
  npc1Traits: PersonalityTraits,
  npc2Traits: PersonalityTraits,
  npc1Mood: Mood,
  npc2Mood: Mood
): ActivityStatus {
  const { agreeableness: agree1, neuroticism: neuro1 } = npc1Traits;
  const { agreeableness: agree2, neuroticism: neuro2 } = npc2Traits;

  // 双方都心情不好或宜人性低，可能争吵
  if (
    ((npc1Mood === 'angry' || npc1Mood === 'anxious') && (npc2Mood === 'angry' || npc2Mood === 'anxious')) ||
    (agree1 < 30 && agree2 < 30 && Math.random() < 0.3)
  ) {
    return 'arguing';
  }

  // 双方都开心，可能大笑
  if ((npc1Mood === 'happy' || npc1Mood === 'excited') && (npc2Mood === 'happy' || npc2Mood === 'excited')) {
    return Math.random() < 0.4 ? 'laughing' : 'chatting';
  }

  // 一方困惑或沉思
  if (npc1Mood === 'confused' || npc2Mood === 'confused') {
    return 'pondering';
  }

  // 默认是正常交流
  return 'chatting';
}

// 更新情绪状态（基于时间和互动）
export function updateEmotionalState(
  traits: PersonalityTraits,
  currentState: NpcEmotionalState,
  deltaTime: number // 毫秒
): NpcEmotionalState {
  const { extraversion, neuroticism, conscientiousness } = traits;
  const newState = { ...currentState };

  // 社交能量恢复（内向的人恢复慢，外向的人恢复快）
  if (!currentState.interactingWithNpcId) {
    const recoveryRate = (100 - extraversion) / 10000; // 内向的人独处时恢复更快
    newState.socialEnergy = Math.min(100, currentState.socialEnergy + recoveryRate * deltaTime);
  } else {
    // 社交中消耗能量（内向的人消耗快）
    const consumptionRate = (100 - extraversion) / 5000;
    newState.socialEnergy = Math.max(0, currentState.socialEnergy - consumptionRate * deltaTime);
  }

  // 压力水平变化
  if (conscientiousness > 60 && currentState.activityStatus === 'idle') {
    // 尽责性高的人闲着会有压力
    newState.stressLevel = Math.min(100, currentState.stressLevel + 0.001 * deltaTime);
  } else if (currentState.activityStatus === 'resting') {
    // 休息时压力降低
    newState.stressLevel = Math.max(0, currentState.stressLevel - 0.002 * deltaTime);
  }

  // 神经质高的人压力波动大
  if (neuroticism > 60) {
    newState.stressLevel = Math.min(100, newState.stressLevel + Math.random() * 0.001 * deltaTime);
  }

  // 根据压力和社交能量调整心情
  if (newState.stressLevel > 70) {
    newState.mood = neuroticism > 60 ? 'anxious' : 'tired';
  } else if (newState.socialEnergy < 20 && extraversion < 40) {
    newState.mood = 'tired';
  } else if (newState.socialEnergy > 70 && extraversion > 60) {
    newState.mood = 'happy';
  } else if (newState.stressLevel < 30 && newState.socialEnergy > 50) {
    newState.mood = 'calm';
  }

  return newState;
}

// 获取状态的中文显示文本
export function getStatusDisplayText(status: ActivityStatus, mood: Mood): string {
  const statusTexts: Record<ActivityStatus, string> = {
    idle: '闲逛中',
    thinking: '思考中',
    busy: '忙碌中',
    chatting: '交流中',
    working: '工作中',
    resting: '休息中',
    arguing: '争吵中',
    laughing: '开心聊天',
    pondering: '沉思中',
  };

  const moodEmojis: Record<Mood, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    excited: '🤩',
    tired: '😴',
    focused: '🤔',
    confused: '😕',
    calm: '😌',
    anxious: '😰',
    neutral: '😐',
  };

  return `${moodEmojis[mood]} ${statusTexts[status]}`;
}

// 生成默认性格特征（基于用户ID的哈希）
export function generateDefaultPersonality(userId: string): PersonalityTraits {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }

  const random = (offset: number) => {
    const value = ((hash + offset) % 60) + 20; // 20-80 范围
    return Math.min(100, Math.max(0, value));
  };

  return {
    openness: random(0),
    conscientiousness: random(100),
    extraversion: random(200),
    agreeableness: random(300),
    neuroticism: random(400),
  };
}
