// 关系系统工具函数

export type RelationshipType = 
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'rival'
  | 'enemy';

export function getRelationshipText(type: RelationshipType): string {
  const texts: Record<RelationshipType, string> = {
    stranger: '陌生人',
    acquaintance: '熟人',
    friend: '朋友',
    close_friend: '好友',
    rival: '竞争对手',
    enemy: '敌人',
  };
  return texts[type] || '未知';
}

export function getAffinityText(affinity: number): string {
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

export function getAffinityColor(affinity: number): string {
  if (affinity >= 60) return '#10b981'; // green
  if (affinity >= 20) return '#3b82f6'; // blue
  if (affinity >= 0) return '#6b7280'; // gray
  if (affinity >= -40) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export function getFamiliarityText(familiarity: number): string {
  if (familiarity >= 80) return '非常熟悉';
  if (familiarity >= 60) return '很熟悉';
  if (familiarity >= 40) return '比较熟悉';
  if (familiarity >= 20) return '有点熟悉';
  return '不太熟';
}
