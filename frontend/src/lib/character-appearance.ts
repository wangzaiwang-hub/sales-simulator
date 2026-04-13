export type CharacterAppearance = {
  character: number;
  tops: number;
  bottoms: number;
  shoes: number;
  hair: number;
  eyes: number;
};

export type CharacterAppearanceLayer = keyof CharacterAppearance;

export const CHARACTER_APPEARANCE_STORAGE_KEY = "sales-simulator-login-appearance";
export const CHARACTER_ROLE_STORAGE_KEY = "sales-simulator-login-role";

export const CHARACTER_LAYER_VARIANTS: Record<CharacterAppearanceLayer, number> = {
  character: 5,
  tops: 29,
  bottoms: 14,
  shoes: 10,
  hair: 25,
  eyes: 4,
};

export const CHARACTER_LAYER_ORDER: CharacterAppearanceLayer[] = [
  "character",
  "shoes",
  "bottoms",
  "tops",
  "hair",
  "eyes",
];

export const CHARACTER_BASE_PATH = "/32x32%20Customizable%20Character%20Pack/Walk";

export const CHARACTER_LAYER_FILES: Record<CharacterAppearanceLayer, string> = {
  character: "Character_Walk",
  tops: "Clothing_Tops_Walk",
  bottoms: "Clothing_Bottoms_Walk",
  shoes: "Clothing_Shoes_Walk",
  hair: "Hair_Walk",
  eyes: "Eyes_Walk",
};

export const CHARACTER_LAYER_FOLDERS: Record<CharacterAppearanceLayer, string> = {
  character: "Character",
  tops: "Clothing",
  bottoms: "Clothing",
  shoes: "Clothing",
  hair: "Hair",
  eyes: "Eyes",
};

export const DEFAULT_CHARACTER_APPEARANCE: CharacterAppearance = {
  character: 0,
  tops: 0,
  bottoms: 0,
  shoes: 0,
  hair: 0,
  eyes: 0,
};

export const STARTER_CHARACTER_ROLES = [
  {
    id: "street-seller",
    name: "街区招牌手",
    title: "热场型店长",
    summary: "适合想先冲熟客好感、把店铺氛围做热的人。",
    accent: "#ff9a63",
    appearance: {
      character: 1,
      tops: 16,
      bottoms: 5,
      shoes: 2,
      hair: 12,
      eyes: 1,
    },
  },
  {
    id: "display-master",
    name: "陈列改造师",
    title: "审美型掌柜",
    summary: "更像会把货架、灯光和第一眼成交率一起调顺的角色。",
    accent: "#78d7ff",
    appearance: {
      character: 3,
      tops: 8,
      bottoms: 10,
      shoes: 6,
      hair: 4,
      eyes: 2,
    },
  },
  {
    id: "night-shift",
    name: "夜班经营者",
    title: "稳场型营业员",
    summary: "偏克制、可靠，适合想慢慢养成自己店铺节奏的人。",
    accent: "#b59dff",
    appearance: {
      character: 4,
      tops: 23,
      bottoms: 1,
      shoes: 8,
      hair: 19,
      eyes: 0,
    },
  },
] as const;

export function randomCharacterAppearance(): CharacterAppearance {
  return {
    character: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.character),
    tops: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.tops),
    bottoms: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.bottoms),
    shoes: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.shoes),
    hair: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.hair),
    eyes: Math.floor(Math.random() * CHARACTER_LAYER_VARIANTS.eyes),
  };
}

export function normalizeAppearance(input: unknown): CharacterAppearance | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const source = input as Record<string, unknown>;
  const nextAppearance = { ...DEFAULT_CHARACTER_APPEARANCE };

  for (const layer of Object.keys(CHARACTER_LAYER_VARIANTS) as CharacterAppearanceLayer[]) {
    const rawValue = source[layer];
    if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
      return null;
    }

    const clampedValue = Math.max(
      0,
      Math.min(CHARACTER_LAYER_VARIANTS[layer] - 1, Math.floor(rawValue)),
    );
    nextAppearance[layer] = clampedValue;
  }

  return nextAppearance;
}

export function getCharacterLayerSheet(
  layer: CharacterAppearanceLayer,
  direction: "Front" | "Back" | "Left" | "Right",
) {
  const folder = CHARACTER_LAYER_FOLDERS[layer];
  const file = CHARACTER_LAYER_FILES[layer];

  return `${CHARACTER_BASE_PATH}/${folder}/${file}_${direction}-Sheet.png`;
}
