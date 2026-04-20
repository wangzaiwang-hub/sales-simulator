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
  resolvedMapKey?: string;
  hasStoredPosition?: boolean;
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
  currentMap?: string | null;
  positionX?: number | null;
  positionY?: number | null;
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
    width: 32,
    height: 32,
    speed: randomFromHash(hash, Math.round(seed.speedMin * 10), Math.round(seed.speedMax * 10)) / 10,
    direction: seed.direction || 'Front',
    currentFrame: 1,
    frameCount: 0,
    animationSpeed: 10,
    isMoving: false,
    collisionWidth: 16,
    collisionHeight: 16,
    collisionOffsetX: 8,
    collisionOffsetY: 16,
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

function buildDynamicUserSeed(user: UserRecord): NpcSeed {
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
    anchorXRatio: 0.12 + 0.76 * ((base % 1000) / 999),
    anchorYRatio: 0.16 + 0.68 * (((base >>> 8) % 1000) / 999),
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
  viewedMapKey: string,
  users: UserRecord[],
  playableMapKeys: string[] = [],
) {
  const dynamicUsers = users
    .filter((user) => user.id !== currentUserId && user.isNpcVisible !== false)
    .filter((user) => {
      const currentMapKey = user.currentMap || 'main';
      const matches = currentMapKey === viewedMapKey;
      if (!matches) {
        console.log('[buildMapNpcs] 用户地图不匹配', {
          userId: user.id,
          username: user.username,
          currentMap: user.currentMap,
          viewedMapKey,
        });
      }
      return matches;
    })
    .map((user) => {
      const seed = buildDynamicUserSeed(user);
      const npc = createNpcFromSeed(
        seed,
        tileSize,
        mapWidth,
        mapHeight,
        hashString(user.id) + 101,
      );

      const hasStoredPosition =
        Number.isFinite(Number(user.positionX)) &&
        Number.isFinite(Number(user.positionY));

      if (hasStoredPosition) {
        const maxX = Math.max(0, mapWidth * tileSize - npc.width);
        const maxY = Math.max(0, mapHeight * tileSize - npc.height);
        const clampedX = Math.max(0, Math.min(maxX, Number(user.positionX)));
        const clampedY = Math.max(0, Math.min(maxY, Number(user.positionY)));
        npc.x = clampedX;
        npc.y = clampedY;
        npc.anchorX = clampedX;
        npc.anchorY = clampedY;
      }

      return {
        ...npc,
        ownerUserId: user.id,
        resolvedMapKey: user.currentMap || viewedMapKey,
        hasStoredPosition,
        sourceType: 'secondme' as const,
      };
    });

  const placedNpcs: typeof dynamicUsers = [];
  const minGap = Math.max(28, Math.floor(tileSize * 0.72));
  const maxX = Math.max(0, mapWidth * tileSize - 48);
  const maxY = Math.max(0, mapHeight * tileSize - 48);

  const isOverlapping = (x: number, y: number) =>
    placedNpcs.some((placed) => {
      const dx = placed.x - x;
      const dy = placed.y - y;
      return Math.hypot(dx, dy) < minGap;
    });

  const findOpenSpot = (npc: (typeof dynamicUsers)[number]) => {
    if (!isOverlapping(npc.x, npc.y)) {
      return { x: npc.x, y: npc.y };
    }

    const step = Math.max(24, Math.floor(tileSize * 0.6));
    const seed = hashString(npc.ownerUserId || npc.id);

    for (let ring = 1; ring <= 6; ring += 1) {
      const radius = ring * step;
      for (let slot = 0; slot < 8; slot += 1) {
        const angle = (((seed + slot) % 8) / 8) * Math.PI * 2;
        const nextX = Math.max(0, Math.min(maxX, npc.x + Math.round(Math.cos(angle) * radius)));
        const nextY = Math.max(0, Math.min(maxY, npc.y + Math.round(Math.sin(angle) * radius)));

        if (!isOverlapping(nextX, nextY)) {
          return { x: nextX, y: nextY };
        }
      }
    }

    return { x: npc.x, y: npc.y };
  };

  for (const npc of dynamicUsers) {
    const resolvedPosition = findOpenSpot(npc);
    npc.x = resolvedPosition.x;
    npc.y = resolvedPosition.y;
    npc.anchorX = resolvedPosition.x;
    npc.anchorY = resolvedPosition.y;
    placedNpcs.push(npc);
  }

  return placedNpcs;
}
