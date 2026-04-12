/**
 * 角色外观生成器
 * 基于32x32 Customizable Character Pack素材
 */

export interface CharacterAppearance {
  character: number;  // 0-4 (5个身体变体)
  tops: number;       // 0-28 (29个上衣变体)
  bottoms: number;    // 0-13 (14个裤子变体)
  shoes: number;      // 0-9 (10个鞋子变体)
  hair: number;       // 0-24 (25个头发变体)
  eyes: number;       // 0-3 (4个眼睛变体)
}

// 每个图层的变体数量
export const CHARACTER_LAYER_VARIANTS = {
  character: 5,
  tops: 29,
  bottoms: 14,
  shoes: 10,
  hair: 25,
  eyes: 4
};

/**
 * 生成随机角色外观
 */
export function generateRandomAppearance(): CharacterAppearance {
  return {
    character: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.character),
    tops: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.tops),
    bottoms: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.bottoms),
    shoes: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.shoes),
    hair: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.hair),
    eyes: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.eyes)
  };
}

function hashSeed(seed: string | number) {
  const value = String(seed);
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function generateStableAppearance(seed: string | number): CharacterAppearance {
  const baseHash = hashSeed(seed);

  return {
    character: baseHash % CHARACTER_LAYER_VARIANTS.character,
    tops: ((baseHash >>> 3) ^ 0x5f356495) % CHARACTER_LAYER_VARIANTS.tops,
    bottoms: ((baseHash >>> 5) ^ 0x27d4eb2d) % CHARACTER_LAYER_VARIANTS.bottoms,
    shoes: ((baseHash >>> 7) ^ 0x165667b1) % CHARACTER_LAYER_VARIANTS.shoes,
    hair: ((baseHash >>> 11) ^ 0x9e3779b9) % CHARACTER_LAYER_VARIANTS.hair,
    eyes: ((baseHash >>> 13) ^ 0x85ebca6b) % CHARACTER_LAYER_VARIANTS.eyes,
  };
}

/**
 * 生成多个不重复的随机角色外观
 */
export function generateMultipleAppearances(count: number): CharacterAppearance[] {
  const appearances: CharacterAppearance[] = [];
  const used = new Set<string>();

  while (appearances.length < count) {
    const appearance = generateRandomAppearance();
    const key = JSON.stringify(appearance);
    
    if (!used.has(key)) {
      used.add(key);
      appearances.push(appearance);
    }
  }

  return appearances;
}

/**
 * 验证角色外观配置是否有效
 */
export function isValidAppearance(appearance: CharacterAppearance): boolean {
  return (
    appearance.character >= 0 && appearance.character < CHARACTER_LAYER_VARIANTS.character &&
    appearance.tops >= 0 && appearance.tops < CHARACTER_LAYER_VARIANTS.tops &&
    appearance.bottoms >= 0 && appearance.bottoms < CHARACTER_LAYER_VARIANTS.bottoms &&
    appearance.shoes >= 0 && appearance.shoes < CHARACTER_LAYER_VARIANTS.shoes &&
    appearance.hair >= 0 && appearance.hair < CHARACTER_LAYER_VARIANTS.hair &&
    appearance.eyes >= 0 && appearance.eyes < CHARACTER_LAYER_VARIANTS.eyes
  );
}

/**
 * 获取角色外观的精灵图路径配置
 */
export function getAppearanceSpritePaths(appearance: CharacterAppearance) {
  const basePath = '/resource/32x32%20Customizable%20Character%20Pack/Walk';
  
  return {
    character: {
      path: `${basePath}/Character/Character_Walk`,
      row: appearance.character
    },
    shoes: {
      path: `${basePath}/Clothing/Clothing_Shoes_Walk`,
      row: appearance.shoes
    },
    bottoms: {
      path: `${basePath}/Clothing/Clothing_Bottoms_Walk`,
      row: appearance.bottoms
    },
    tops: {
      path: `${basePath}/Clothing/Clothing_Tops_Walk`,
      row: appearance.tops
    },
    hair: {
      path: `${basePath}/Hair/Hair_Walk`,
      row: appearance.hair
    },
    eyes: {
      path: `${basePath}/Eyes/Eyes_Walk`,
      row: appearance.eyes
    }
  };
}
