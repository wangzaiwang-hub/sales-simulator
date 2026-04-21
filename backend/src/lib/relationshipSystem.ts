// NPC关系和好感度系统

import type { PersonalityTraits, Mood } from './npcEmotions';

export type RelationshipType = 
  | 'stranger' // 陌生人
  | 'acquaintance' // 熟人
  | 'friend' // 朋友
  | 'close_friend' // 好友
  | 'rival' // 竞争对手
  | 'enemy'; // 敌人

export type Relationship = {
  id: string;
  userId: string;
  targetUserId: string;
  affinity: number; // 好感度 -100 到 100
  familiarity: number; // 熟悉度 0 到 100
  lastInteractionAt?: Date | null;
  interactionCount: number;
  relationshipType: RelationshipType;
  createdAt: Date;
  updatedAt: Date;
};

export type InteractionType = 
  | 'chat' // 聊天
  | 'gift' // 送礼
  | 'help' // 帮助
  | 'conflict' // 冲突
  | 'ignore'; // 忽视

// 根据好感度和熟悉度确定关系类型
export function determineRelationshipType(affinity: number, familiarity: number): RelationshipType {
  // 敌对关系
  if (affinity < -50) return 'enemy';
  if (affinity < -20) return 'rival';
  
  // 友好关系（需要一定熟悉度）
  if (affinity > 70 && familiarity > 60) return 'close_friend';
  if (affinity > 40 && familiarity > 30) return 'friend';
  if (familiarity > 20) return 'acquaintance';
  
  // 默认陌生人
  return 'stranger';
}

// 计算初始好感度（基于性格相似度和第一印象）
export function calculateInitialAffinity(
  person1Traits: PersonalityTraits,
  person2Traits: PersonalityTraits,
  person1Mood: Mood,
  person2Mood: Mood
): number {
  // 性格相似度影响初始好感
  const opennessDiff = Math.abs(person1Traits.openness - person2Traits.openness);
  const extraversionDiff = Math.abs(person1Traits.extraversion - person2Traits.extraversion);
  const agreeablenessDiff = Math.abs(person1Traits.agreeableness - person2Traits.agreeableness);
  
  // 性格越相似，初始好感越高
  const similarityScore = 100 - (opennessDiff + extraversionDiff + agreeablenessDiff) / 3;
  
  // 宜人性高的人初始好感更高
  const agreeablenessScore = (person1Traits.agreeableness + person2Traits.agreeableness) / 2;

  const moodToScore = (mood: Mood) => {
    switch (mood) {
      case 'happy':
      case 'excited':
        return 65;
      case 'angry':
      case 'sad':
      case 'anxious':
        return 40;
      default:
        return 50;
    }
  };

  // 第一印象按 7:3 权重：
  // 70% 看性格匹配和基础亲和度，30% 才看当下心情。
  const personalityScore = similarityScore * 0.6 + agreeablenessScore * 0.4;
  const moodScore = (moodToScore(person1Mood) + moodToScore(person2Mood)) / 2;
  const weightedScore = personalityScore * 0.7 + moodScore * 0.3;

  // 中性开局尽量靠近 0，避免一句“你好”之前就先掉很多好感。
  const initialAffinity = Math.round((weightedScore - 50) * 0.45);

  return Math.max(-8, Math.min(18, initialAffinity));
}

// 判断是否愿意接受社交（考虑关系）
export function shouldAcceptInteraction(
  npcTraits: PersonalityTraits,
  npcMood: Mood,
  socialEnergy: number,
  stressLevel: number,
  relationship: Relationship | null,
  isFirstMeeting: boolean
): { 
  accept: boolean; 
  reason?: string;
  rejectionType?: 'social_anxiety' | 'introverted' | 'nervous' | 'conservative' | 'bad_mood' | 'busy' | 'tired' | 'unfriendly' | 'enemy' | 'random';
} {
  const { extraversion, agreeableness, neuroticism, openness } = npcTraits;
  
  // 如果是好友或亲密好友，几乎总是接受
  if (relationship && (relationship.relationshipType === 'friend' || relationship.relationshipType === 'close_friend')) {
    if (stressLevel > 85) {
      return { accept: false, reason: '抱歉，我现在真的很忙，改天再聊吧。', rejectionType: 'busy' };
    }
    return { accept: true };
  }
  
  // 如果是敌人或竞争对手，大概率拒绝
  if (relationship && (relationship.relationshipType === 'enemy' || relationship.relationshipType === 'rival')) {
    if (agreeableness < 40 || Math.random() < 0.7) {
      return { accept: false, reason: '我不想和你说话。', rejectionType: 'enemy' };
    }
  }
  
  // 陌生人或第一次见面
  if (isFirstMeeting || !relationship || relationship.relationshipType === 'stranger') {
    // 社恐（外向性很低）对陌生人很抗拒
    if (extraversion < 20) {
      if (socialEnergy < 30 || Math.random() < 0.6) {
        return { accept: false, reason: '不好意思，我不太习惯和陌生人说话...', rejectionType: 'social_anxiety' };
      }
    }
    
    // 外向性低的人对陌生人也比较抗拒
    if (extraversion < 30) {
      if (socialEnergy < 20 || Math.random() < 0.3) {
        return { accept: false, reason: '抱歉，我现在不太想聊天。', rejectionType: 'introverted' };
      }
    }
    
    // 神经质高的人对陌生人警惕
    if (neuroticism > 75 && Math.random() < 0.25) {
      return { accept: false, reason: '我们好像不认识吧...', rejectionType: 'nervous' };
    }
    
    // 开放性低的人不喜欢新接触
    if (openness < 25 && Math.random() < 0.2) {
      return { accept: false, reason: '不好意思，我有点事。', rejectionType: 'conservative' };
    }
  }
  
  // 熟人但好感度低
  if (relationship && relationship.affinity < -10 && relationship.relationshipType === 'acquaintance') {
    if (Math.random() < 0.5) {
      return { accept: false, reason: '我现在不太方便。', rejectionType: 'random' };
    }
  }
  
  // 正在忙碌
  if (stressLevel > 70) {
    return { accept: false, reason: '我现在有点忙，等会儿再说吧。', rejectionType: 'busy' };
  }
  
  // 心情不好
  if ((npcMood === 'sad' || npcMood === 'angry' || npcMood === 'anxious') && neuroticism > 70) {
    if (Math.random() < 0.4) {
      return { accept: false, reason: '我现在心情不太好，不想说话。', rejectionType: 'bad_mood' };
    }
  }
  
  // 社交能量低
  if (socialEnergy < 15 && extraversion < 40) {
    return { accept: false, reason: '我有点累了，想休息一下。', rejectionType: 'tired' };
  }
  
  // 宜人性低，随机拒绝
  if (agreeableness < 25 && Math.random() < 0.2) {
    return { accept: false, reason: '不想聊。', rejectionType: 'unfriendly' };
  }
  
  // 根据外向性和宜人性计算接受概率（提高基础接受率）
  const acceptChance = (extraversion * 0.5 + agreeableness * 0.3 + 30) / 100; // 加30基础分
  
  // 如果是熟人，提高接受概率
  const familiarityBonus = relationship ? relationship.familiarity / 200 : 0;
  const affinityBonus = relationship && relationship.affinity > 0 ? relationship.affinity / 200 : 0;
  
  const finalChance = Math.min(0.95, acceptChance + familiarityBonus + affinityBonus); // 最高95%接受率
  
  if (Math.random() < finalChance) {
    return { accept: true };
  }
  
  return { accept: false, reason: '不好意思，我现在不太想聊天。', rejectionType: 'random' };
}

// 计算互动后的好感度变化
export function calculateAffinityChange(
  interactionType: InteractionType,
  npcTraits: PersonalityTraits,
  playerTraits: PersonalityTraits,
  currentAffinity: number,
  conversationQuality: number = 50 // 0-100，对话质量
): number {
  let change = 0;
  
  switch (interactionType) {
    case 'chat':
      // 对话质量影响好感度变化
      change = (conversationQuality - 50) / 10; // -5 到 +5
      
      // 宜人性高的人更容易增加好感
      if (npcTraits.agreeableness > 60) {
        change += 1;
      }
      
      // 性格相似度影响
      const similarity = 100 - (
        Math.abs(npcTraits.openness - playerTraits.openness) +
        Math.abs(npcTraits.extraversion - playerTraits.extraversion) +
        Math.abs(npcTraits.agreeableness - playerTraits.agreeableness)
      ) / 3;
      
      if (similarity > 70) {
        change += 2;
      } else if (similarity < 30) {
        change -= 1;
      }
      break;
      
    case 'gift':
      change = 5 + Math.random() * 5; // +5 到 +10
      break;
      
    case 'help':
      change = 8 + Math.random() * 7; // +8 到 +15
      break;
      
    case 'conflict':
      change = -10 - Math.random() * 10; // -10 到 -20
      break;
      
    case 'ignore':
      change = -2 - Math.random() * 3; // -2 到 -5
      break;
  }
  
  // 好感度越高，增长越慢（边际效应递减）
  if (currentAffinity > 50 && change > 0) {
    change *= 0.5;
  }
  
  // 好感度很低时，更难提升
  if (currentAffinity < -30 && change > 0) {
    change *= 0.3;
  }
  
  return Math.round(change);
}

// 计算熟悉度变化
export function calculateFamiliarityChange(
  interactionType: InteractionType,
  currentFamiliarity: number
): number {
  let change = 0;
  
  switch (interactionType) {
    case 'chat':
      change = 2 + Math.random() * 3; // +2 到 +5
      break;
    case 'gift':
    case 'help':
      change = 3 + Math.random() * 4; // +3 到 +7
      break;
    case 'conflict':
      change = 1; // 冲突也会增加熟悉度（负面的熟悉）
      break;
    case 'ignore':
      change = 0;
      break;
  }
  
  // 熟悉度越高，增长越慢
  if (currentFamiliarity > 70 && change > 0) {
    change *= 0.5;
  }
  
  return Math.round(change);
}

// 获取关系描述文本
export function getRelationshipDescription(relationship: Relationship | null): string {
  if (!relationship || relationship.relationshipType === 'stranger') {
    return '陌生人';
  }
  
  const descriptions: Record<RelationshipType, string> = {
    stranger: '陌生人',
    acquaintance: '熟人',
    friend: '朋友',
    close_friend: '好友',
    rival: '竞争对手',
    enemy: '敌人',
  };
  
  return descriptions[relationship.relationshipType];
}

// 获取好感度等级描述
export function getAffinityLevel(affinity: number): string {
  if (affinity >= 80) return '非常喜欢';
  if (affinity >= 60) return '很喜欢';
  if (affinity >= 40) return '喜欢';
  if (affinity >= 20) return '有好感';
  if (affinity >= 0) return '普通';
  if (affinity >= -20) return '不太喜欢';
  if (affinity >= -40) return '不喜欢';
  if (affinity >= -60) return '很不喜欢';
  return '非常讨厌';
}

// 生成默认玩家性格（用于计算相似度）
export function generateDefaultPlayerPersonality(userId: string): PersonalityTraits {
  // 可以从数据库读取，这里先用默认值
  return {
    openness: 60,
    conscientiousness: 55,
    extraversion: 50,
    agreeableness: 60,
    neuroticism: 40,
  };
}
