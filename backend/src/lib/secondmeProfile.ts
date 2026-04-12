type SecondMeProfile = Record<string, any>;

export type NormalizedNpcProfile = {
  profession: string | null;
  interests: string[];
  personaSummary: string | null;
  npcBehavior: 'wander' | 'patrol' | 'socialize' | 'shopkeep' | 'guard';
  secondmeProfile: Record<string, unknown>;
};

const DEFAULT_INTERESTS = ['社交', '探索'];

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : typeof item === 'object' && item && 'name' in item ? String((item as any).name) : null))
      .filter((item): item is string => Boolean(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[、,，|/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function normalizeSecondMeProfile(profile: SecondMeProfile): NormalizedNpcProfile {
  const profession = pickFirstString(
    profile.profession,
    profile.jobTitle,
    profile.job,
    profile.occupation,
    profile.title,
    profile.industry,
  );

  const interests = Array.from(
    new Set(
      [
        ...toStringList(profile.interests),
        ...toStringList(profile.tags),
        ...toStringList(profile.keywords),
        ...toStringList(profile.hobbies),
      ],
    ),
  ).slice(0, 6);

  const personaSummary = pickFirstString(
    profile.personaSummary,
    profile.bio,
    profile.introduction,
    profile.description,
    profile.signature,
    profile.about,
  );

  const lowerSignals = `${profession || ''} ${interests.join(' ')} ${personaSummary || ''}`.toLowerCase();
  let npcBehavior: NormalizedNpcProfile['npcBehavior'] = 'wander';

  if (/(守卫|安保|巡逻|security|guard|police)/.test(lowerSignals)) npcBehavior = 'guard';
  else if (/(销售|商店|店长|零售|经营|merchant|shop|sale)/.test(lowerSignals)) npcBehavior = 'shopkeep';
  else if (/(社区|运营|主持|社交|social|community|creator)/.test(lowerSignals)) npcBehavior = 'socialize';
  else if (/(产品|项目|管理|pm|planner)/.test(lowerSignals)) npcBehavior = 'patrol';

  return {
    profession,
    interests: interests.length ? interests : DEFAULT_INTERESTS,
    personaSummary,
    npcBehavior,
    secondmeProfile: {
      id: profile.id ?? null,
      name: profile.name ?? profile.username ?? null,
      username: profile.username ?? null,
      email: profile.email ?? null,
      picture: profile.picture ?? null,
      bio: profile.bio ?? profile.description ?? null,
      title: profession,
      interests: interests.length ? interests : DEFAULT_INTERESTS,
    },
  };
}
