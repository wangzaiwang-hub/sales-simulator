type Direction = 'Front' | 'Back' | 'Left' | 'Right';
type NpcBehavior = 'wander' | 'patrol' | 'socialize' | 'shopkeep' | 'guard';
type NpcRole = 'villager' | 'merchant' | 'guard' | 'visitor' | 'creator';

import type { PersonalityTraits, Mood, ActivityStatus } from '../lib/npcEmotions';
import { generateDefaultPersonality, calculateSocialPreference } from '../lib/npcEmotions';
import { generateStableAppearance, isValidAppearance, type CharacterAppearance } from '../lib/characterGenerator';

export type NpcSeed = {
  id: string;
  name: string;
  role: NpcRole;
  profession?: string;
  interests?: string[];
  bio?: string;
  avatar?: string | null;
  spriteColumnOffset: number;
  characterRow: number;
  direction?: Direction;
  behavior: NpcBehavior;
  anchorXRatio: number;
  anchorYRatio: number;
  roamRadiusTiles: number;
  idleChance: number;
  moveIntervalMin: number;
  moveIntervalMax: number;
  speedMin: number;
  speedMax: number;
  appearance?: CharacterAppearance | string | null;
};

export type MapNpcPayload = {
  id: string;
  ownerUserId?: string | null;
  sourceType: 'static' | 'secondme';
  name: string;
  role: NpcRole;
  profession?: string;
  interests: string[];
  bio?: string;
  avatar?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: Direction;
  currentFrame: number;
  frameCount: number;
  animationSpeed: number;
  isMoving: boolean;
  collisionWidth: number;
  collisionHeight: number;
  collisionOffsetX: number;
  collisionOffsetY: number;
  spriteColumnOffset: number;
  characterRow: number;
  moveTimer: number;
  moveInterval: number;
  idleChance: number;
  behavior: NpcBehavior;
  anchorX: number;
  anchorY: number;
  roamRadius: number;
  // 新增情绪和性格字段
  personalityTraits: PersonalityTraits;
  currentMood: Mood;
  activityStatus: ActivityStatus;
  socialEnergy: number;
  stressLevel: number;
  interactingWithNpcId?: string | null;
  // 新增角色外观配置
  appearance?: CharacterAppearance;
};

type UserRecord = {
  id: string;
  secondmeId?: string;
  username: string;
  avatar?: string | null;
  secondmeProfile?: Record<string, any> | null;
  profession?: string | null;
  interests?: string[] | string | null;
  personaSummary?: string | null;
  npcBehavior?: string | null;
  isNpcVisible?: boolean | null;
  personalityTraits?: PersonalityTraits | string | null;
  currentMood?: Mood | null;
  activityStatus?: ActivityStatus | null;
  characterAppearance?: CharacterAppearance | string | null;
};

function resolveAvatarUrl(user: UserRecord) {
  return (
    user.avatar ||
    user.secondmeProfile?.picture ||
    user.secondmeProfile?.avatar ||
    user.secondmeProfile?.avatarUrl ||
    user.secondmeProfile?.avatar_url ||
    null
  );
}

function parseStoredAppearance(value: UserRecord['characterAppearance'] | NpcSeed['appearance']) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed) as CharacterAppearance;
      return isValidAppearance(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  if (typeof value === 'object' && isValidAppearance(value as CharacterAppearance)) {
    return value as CharacterAppearance;
  }

  return null;
}

function normalizeInterests(value: UserRecord['interests']) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[、,，|/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

const USER_PROFESSIONS = ['创作者', '设计师', '独立开发者', '产品经理', '研究员', '讲述者'];
const USER_INTEREST_POOL = ['商业', '创作', '科技', '社交', '探索', '游戏', '故事', '设计'];
const USER_SPRITES = [
  { spriteColumnOffset: 0, characterRow: 4 },
  { spriteColumnOffset: 3, characterRow: 0 },
  { spriteColumnOffset: 0, characterRow: 0 },
  { spriteColumnOffset: 3, characterRow: 4 },
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function randomFromHash(hash: number, min: number, max: number) {
  return min + (hash % (max - min + 1));
}

function clampRatio(value: number) {
  return Math.max(0.12, Math.min(value, 0.88));
}

function createNpcFromSeed(seed: NpcSeed, tileSize: number, mapWidth: number, mapHeight: number, salt = 0): MapNpcPayload {
  const hash = hashString(`${seed.id}:${salt}`);
  const x = Math.floor(mapWidth * clampRatio(seed.anchorXRatio)) * tileSize;
  const y = Math.floor(mapHeight * clampRatio(seed.anchorYRatio)) * tileSize;
  
  // 生成性格特征
  const personality = generateDefaultPersonality(seed.id);
  const socialPref = calculateSocialPreference(personality);
  
  // 根据性格初始化情绪状态
  const initialMood: Mood = personality.extraversion > 60 ? 'happy' : 'calm';
  const initialStatus: ActivityStatus = personality.conscientiousness > 60 ? 'working' : 'idle';
  
  const appearance =
    parseStoredAppearance(seed.appearance) ??
    generateStableAppearance(`${seed.id}:${salt}:appearance`);

  return {
    id: seed.id,
    ownerUserId: null,
    sourceType: 'static',
    name: seed.name,
    role: seed.role,
    profession: seed.profession,
    interests: seed.interests || [],
    bio: seed.bio,
    avatar: seed.avatar ?? null,
    x,
    y,
    width: 48,
    height: 48,
    speed: randomFromHash(hash, Math.round(seed.speedMin * 10), Math.round(seed.speedMax * 10)) / 10,
    direction: seed.direction || 'Front',
    currentFrame: 1,
    frameCount: 0,
    animationSpeed: 10,
    isMoving: false,
    collisionWidth: 24,
    collisionHeight: 16,
    collisionOffsetX: 12,
    collisionOffsetY: 32,
    spriteColumnOffset: seed.spriteColumnOffset,
    characterRow: seed.characterRow,
    moveTimer: 0,
    moveInterval: randomFromHash(hash >>> 3, seed.moveIntervalMin, seed.moveIntervalMax),
    idleChance: seed.idleChance,
    behavior: seed.behavior,
    anchorX: x,
    anchorY: y,
    roamRadius: seed.roamRadiusTiles * tileSize,
    // 情绪和性格
    personalityTraits: personality,
    currentMood: initialMood,
    activityStatus: initialStatus,
    socialEnergy: 50 + personality.extraversion / 2, // 外向的人初始社交能量高
    stressLevel: personality.neuroticism / 2, // 神经质高的人初始压力大
    interactingWithNpcId: null,
    // 角色外观
    appearance,
  };
}

function buildDynamicUserSeed(user: UserRecord, index: number, total: number): NpcSeed {
  const base = hashString(user.secondmeId || user.id || user.username);
  const sprite = USER_SPRITES[base % USER_SPRITES.length];
  const profession = user.profession || USER_PROFESSIONS[base % USER_PROFESSIONS.length];
  const interests = normalizeInterests(user.interests);
  const normalizedInterests = interests.length
    ? interests
    : [
        USER_INTEREST_POOL[base % USER_INTEREST_POOL.length],
        USER_INTEREST_POOL[(base + 3) % USER_INTEREST_POOL.length],
      ];
  const spread = total <= 1 ? 0.5 : index / Math.max(total - 1, 1);
  
  // 解析性格特征
  let personality: PersonalityTraits;
  if (user.personalityTraits) {
    if (typeof user.personalityTraits === 'string') {
      try {
        personality = JSON.parse(user.personalityTraits);
      } catch {
        personality = generateDefaultPersonality(user.id);
      }
    } else {
      personality = user.personalityTraits;
    }
  } else {
    personality = generateDefaultPersonality(user.id);
  }
  
  // 根据外向性决定行为模式
  const behavior: NpcBehavior = 
    personality.extraversion > 70 ? 'socialize' :
    personality.extraversion > 40 ? 'wander' :
    'shopkeep';

  return {
    id: `user-npc-${user.id}`,
    name: user.username,
    role: 'creator',
    profession,
    interests: normalizedInterests,
    bio: user.personaSummary || `${profession}，偏爱${normalizedInterests.join('、')}。`,
    avatar: resolveAvatarUrl(user),
    spriteColumnOffset: sprite.spriteColumnOffset,
    characterRow: sprite.characterRow,
    direction: ['Front', 'Left', 'Right', 'Back'][base % 4] as Direction,
    behavior: (user.npcBehavior as NpcBehavior) || behavior,
    anchorXRatio: 0.2 + 0.6 * spread,
    anchorYRatio: 0.58 + 0.16 * ((base % 5) / 4),
    roamRadiusTiles: 3 + (base % 3),
    idleChance: 0.32 + ((base % 3) * 0.08),
    moveIntervalMin: 60,
    moveIntervalMax: 120,
    speedMin: 0.7,
    speedMax: 1.2,
    appearance: user.characterAppearance ?? null,
  };
}

export function buildMapNpcs(
  tileSize: number,
  mapWidth: number,
  mapHeight: number,
  currentUserId: string,
  users: UserRecord[],
) {
  const dynamicUsers = users
    .filter((user) => user.id !== currentUserId && user.isNpcVisible !== false)
    .slice(0, 8)
    .map((user, index, list) => {
      const npc = createNpcFromSeed(
        buildDynamicUserSeed(user, index, list.length),
        tileSize,
        mapWidth,
        mapHeight,
        index + 101,
      );

      return {
        ...npc,
        ownerUserId: user.id,
        sourceType: 'secondme' as const,
      };
    });

  return dynamicUsers;
}
