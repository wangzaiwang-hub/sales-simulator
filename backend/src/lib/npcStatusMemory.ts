export type NpcStatusMemory = {
  moodReason?: string | null;
  activityDetail?: string | null;
  recentStatusEvent?: string | null;
  statusUpdatedAt?: string | null;
};

export function readNpcStatusMemory(profile: unknown): NpcStatusMemory {
  if (!profile || typeof profile !== 'object') {
    return {};
  }

  const record = profile as Record<string, unknown>;
  const memory =
    (record.npcStatusMemory && typeof record.npcStatusMemory === 'object'
      ? (record.npcStatusMemory as Record<string, unknown>)
      : null) || null;

  const source = memory || record;

  return {
    moodReason: typeof source.moodReason === 'string' ? source.moodReason : null,
    activityDetail: typeof source.activityDetail === 'string' ? source.activityDetail : null,
    recentStatusEvent: typeof source.recentStatusEvent === 'string' ? source.recentStatusEvent : null,
    statusUpdatedAt: typeof source.statusUpdatedAt === 'string' ? source.statusUpdatedAt : null,
  };
}

export function mergeNpcStatusMemory(profile: unknown, memory: NpcStatusMemory) {
  const base =
    profile && typeof profile === 'object' && !Array.isArray(profile)
      ? { ...(profile as Record<string, unknown>) }
      : {};

  const previous =
    base.npcStatusMemory && typeof base.npcStatusMemory === 'object' && !Array.isArray(base.npcStatusMemory)
      ? { ...(base.npcStatusMemory as Record<string, unknown>) }
      : {};

  return {
    ...base,
    npcStatusMemory: {
      ...previous,
      ...memory,
    },
  };
}
