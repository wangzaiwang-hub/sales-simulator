import { Request, Response } from 'express';
import crypto from 'crypto';
import { eq, inList, insertRows, order, selectMany, selectOne, updateRows } from '../lib/supabase';
import { buildMapNpcs } from '../config/npcs';
import { buildLocalNpcReply, requestSecondMeDirectReply, requestSecondMeNpcReply } from '../lib/npcChat';
import { syncSecondMeAvatarApiKey } from '../lib/secondmeAvatar';
import {
  extractMemorySummaries,
  MEMORY_SUMMARY_SOURCE,
  persistConversationMemorySummary,
  splitChatRows,
  syncConversationMemoryToSecondMeNote,
} from '../lib/conversationMemory';

type Row = Record<string, any>;
type PortalArea = {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  portalCode?: string | number;
};

function normalizeTraitValue(value: unknown, fallback = 50) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, numeric));
}

function normalizePersonalityTraits(raw: unknown) {
  const parsed =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })()
      : raw;

  const source = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};

  return {
    openness: normalizeTraitValue(source.openness),
    conscientiousness: normalizeTraitValue(source.conscientiousness),
    extraversion: normalizeTraitValue(source.extraversion),
    agreeableness: normalizeTraitValue(source.agreeableness),
    neuroticism: normalizeTraitValue(source.neuroticism),
  };
}

function parseStoredMap(currentMap: unknown) {
  try {
    const parsed =
      typeof currentMap === 'string'
        ? (() => {
            const trimmed = currentMap.trim();
            if (!trimmed.startsWith('{')) {
              return null;
            }
            return JSON.parse(trimmed);
          })()
        : currentMap;
    
    // 验证地图数据的基本结构
    if (!parsed || typeof parsed !== 'object') {
      console.log('地图数据无效：不是对象');
      return null;
    }
    
    // 如果是空对象，返回 null 使用默认地图
    if (Object.keys(parsed).length === 0) {
      console.log('地图数据为空对象，使用默认地图');
      return null;
    }
    
    // 新格式地图：对象列表 + 碰撞区，允许直接进入游戏
    if (parsed.objects && Array.isArray(parsed.objects)) {
      const hasInvalidObjectAsset = parsed.objects.some((obj: any) => {
        const spritePath = obj?.spriteData?.spriteImageSrc;
        if (typeof spritePath !== 'string') {
          return false;
        }

        return (
          spritePath.includes('/tools/') ||
          spritePath.includes('tileset-editor') ||
          spritePath.startsWith('http://localhost')
        );
      });

      if (hasInvalidObjectAsset) {
        console.log('新格式地图包含无效对象素材路径，使用默认地图');
        return null;
      }

      console.log('成功解析新格式地图');
      return parsed;
    }
    
    // 验证旧格式地图的必需字段
    if (!parsed.layers || !Array.isArray(parsed.layers)) {
      console.log('地图数据无效：缺少layers数组');
      return null;
    }
    
    // 检查是否包含无效的tileset路径
    for (const layer of parsed.layers) {
      if (layer.tileset && (
        layer.tileset.includes('/tools/') || 
        layer.tileset.includes('tileset-editor') ||
        layer.tileset.startsWith('http://localhost')
      )) {
        console.log(`地图数据包含无效的tileset路径: ${layer.tileset}，使用默认地图`);
        return null;
      }
    }
    
    console.log('成功解析旧格式地图');
    return parsed;
  } catch (error) {
    console.log('解析地图数据失败:', error);
    return null;
  }
}

// 默认地图（当数据库中没有地图时使用）
function getDefaultMap() {
  return {
    width: 20,
    height: 15,
    tileSize: 48,
    layers: [
      {
        name: "地面",
        visible: true,
        tileset: "CGS_RU_HouseFree/img/tilesets/CGS_Urban_A2.png",
        tileSize: 48,
        data: Array(15).fill(null).map(() => 
          Array(20).fill(null).map(() => ({
            x: 0,
            y: 0,
            collision: false
          }))
        )
      }
    ]
  };
}

function getPortalAreas(map: any): PortalArea[] {
  return Array.isArray(map?.portalAreas) ? map.portalAreas : [];
}

function hasPlayablePortals(map: any) {
  return getPortalAreas(map).some((area) => {
    const code = area?.portalCode;
    return code !== undefined && code !== null && String(code).trim() !== '';
  });
}

async function getPlayableSharedMapKeys() {
  const sharedMaps = await selectMany<Row>('SharedMap', {
    select: 'id,mapData',
    order: order('updatedAt', false),
    limit: 100,
  });

  return sharedMaps
    .filter((sharedMap) => sharedMap?.id && sharedMap?.mapData)
    .map((sharedMap) => ({
      id: sharedMap.id as string,
      map: parseStoredMap(sharedMap.mapData),
    }))
    .filter((entry) => entry.map && hasPlayablePortals(entry.map))
    .map((entry) => `shared:${entry.id}`);
}

function getMapDimensions(map: any) {
  const tileSize = map?.gridSize || map?.tileSize || 48;
  const mapWidth = map?.cols || map?.width || 20;
  const mapHeight = map?.rows || map?.height || 15;
  return { tileSize, mapWidth, mapHeight };
}

function getBlockedAreasFromMap(map: any) {
  const blockedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];

  const collectObjectCollisions = (obj: any, parentOffsetX = 0, parentOffsetY = 0) => {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    const offsetX = parentOffsetX + (obj.x || 0);
    const offsetY = parentOffsetY + (obj.y || 0);

    if (obj.isGroup && Array.isArray(obj.children)) {
      obj.children.forEach((child: any) => {
        const childOffsetX = offsetX + (child.relativeX || 0);
        const childOffsetY = offsetY + (child.relativeY || 0);
        collectObjectCollisions(child, childOffsetX, childOffsetY);
      });
      return;
    }

    if (obj.collision) {
      blockedAreas.push({
        x: obj.collision.x,
        y: obj.collision.y,
        width: obj.collision.width,
        height: obj.collision.height,
      });
    }
  };

  if (Array.isArray(map?.objects)) {
    map.objects.forEach((obj: any) => collectObjectCollisions(obj));
  }

  return blockedAreas;
}

function relocateNpcsAwayFromBlockedAreas(
  npcs: Array<{ id: string; x: number; y: number; width: number; height: number; anchorX: number; anchorY: number }>,
  blockedAreas: Array<{ x: number; y: number; width: number; height: number }>,
  mapWidth: number,
  mapHeight: number,
  tileSize: number,
) {
  if (!blockedAreas.length || !npcs.length) {
    return npcs;
  }

  const maxX = Math.max(0, mapWidth * tileSize - 48);
  const maxY = Math.max(0, mapHeight * tileSize - 48);
  const placed: Array<{ x: number; y: number; width: number; height: number }> = [];
  const step = Math.max(24, Math.floor(tileSize * 0.8));

  const intersectsRect = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ) =>
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;

  const isBlocked = (x: number, y: number, width: number, height: number) => {
    // 使用 NPC 的实际碰撞体积而不是整个精灵大小
    const collisionRect = {
      x: x + 8, // collisionOffsetX
      y: y + 16, // collisionOffsetY
      width: 16, // collisionWidth
      height: 16, // collisionHeight
    };
    return (
      blockedAreas.some((area) => intersectsRect(collisionRect, area)) ||
      placed.some((area) => intersectsRect(collisionRect, area))
    );
  };

  for (const npc of npcs) {
    let resolvedX = npc.x;
    let resolvedY = npc.y;

    if (isBlocked(resolvedX, resolvedY, npc.width, npc.height)) {
      const seed = Number.parseInt(crypto.createHash('md5').update(npc.id).digest('hex').slice(0, 8), 16);

      outer: for (let ring = 1; ring <= 10; ring += 1) {
        const radius = ring * step;
        for (let slot = 0; slot < 12; slot += 1) {
          const angle = (((seed + slot) % 12) / 12) * Math.PI * 2;
          const candidateX = Math.max(0, Math.min(maxX, npc.x + Math.round(Math.cos(angle) * radius)));
          const candidateY = Math.max(0, Math.min(maxY, npc.y + Math.round(Math.sin(angle) * radius)));

          if (!isBlocked(candidateX, candidateY, npc.width, npc.height)) {
            resolvedX = candidateX;
            resolvedY = candidateY;
            break outer;
          }
        }
      }
    }

    npc.x = resolvedX;
    npc.y = resolvedY;
    npc.anchorX = resolvedX;
    npc.anchorY = resolvedY;
    // 记录实际的碰撞体积位置
    placed.push({
      x: resolvedX + 8, // collisionOffsetX
      y: resolvedY + 16, // collisionOffsetY
      width: 16, // collisionWidth
      height: 16, // collisionHeight
    });
  }

  return npcs;
}

async function buildMapNpcPayload(userId: string, map: any, viewedMapKey: string) {
  console.log('[buildMapNpcPayload] 开始构建 NPC 列表', { userId, viewedMapKey });
  
  const { tileSize, mapWidth, mapHeight } = getMapDimensions(map);
  const users = await selectMany<{
    id: string;
    secondmeId?: string;
    username: string;
    avatar?: string | null;
    secondmeProfile?: Record<string, unknown> | null;
    profession?: string | null;
    interests?: string[] | string | null;
    personaSummary?: string | null;
    npcBehavior?: string | null;
    isNpcVisible?: boolean | null;
    personalityTraits?: any;
    currentMood?: string | null;
    activityStatus?: string | null;
  }>('User', {
    select: 'id,secondmeId,username,avatar,secondmeProfile,profession,interests,personaSummary,npcBehavior,isNpcVisible,personalityTraits,currentMood,activityStatus',
    order: order('createdAt', false),
    limit: 20,
  });
  const userIds = users.map((user) => user.id);
  const progressRows = userIds.length
    ? await selectMany<Row>('GameProgress', {
        select: 'userId,characterAppearance,currentMap,positionX,positionY',
        ...inList('userId', userIds),
        limit: userIds.length,
      })
    : [];
  const progressByUserId = new Map(
    progressRows.map((progress) => [progress.userId, progress]),
  );
  const playableMapKeys = await getPlayableSharedMapKeys();

  console.log('[buildMapNpcPayload] 用户和地图数据', {
    totalUsers: users.length,
    playableMapKeys: playableMapKeys.length,
    viewedMapKey,
  });

  const npcs = buildMapNpcs(
    tileSize,
    mapWidth,
    mapHeight,
    userId,
    viewedMapKey,
    users.map((user) => ({
      ...user,
      characterAppearance: progressByUserId.get(user.id)?.characterAppearance ?? null,
      currentMap: progressByUserId.get(user.id)?.currentMap ?? 'main',
      positionX: progressByUserId.get(user.id)?.positionX ?? null,
      positionY: progressByUserId.get(user.id)?.positionY ?? null,
    })) as any,
    playableMapKeys,
  );

  console.log('[buildMapNpcPayload] buildMapNpcs 返回', { npcCount: npcs.length });

  const relocatedNpcs = relocateNpcsAwayFromBlockedAreas(
    npcs as any,
    getBlockedAreasFromMap(map),
    mapWidth,
    mapHeight,
    tileSize,
  );

  await Promise.all(
    relocatedNpcs
      .filter((npc: any) => npc.ownerUserId)
      .map(async (npc: any) => {
        const nextMapKey = npc.resolvedMapKey || viewedMapKey;
        const previous = progressByUserId.get(npc.ownerUserId);

        const prevX = Number(previous?.positionX);
        const prevY = Number(previous?.positionY);
        const prevMap = typeof previous?.currentMap === 'string' ? previous.currentMap : null;
        const nextX = Math.round(npc.x);
        const nextY = Math.round(npc.y);

        const shouldPersist =
          !npc.hasStoredPosition ||
          !Number.isFinite(prevX) ||
          !Number.isFinite(prevY) ||
          prevMap !== nextMapKey ||
          Math.round(prevX) !== nextX ||
          Math.round(prevY) !== nextY;

        if (!shouldPersist) {
          return;
        }

        await updateRows<Row>(
          'GameProgress',
          eq('userId', npc.ownerUserId),
          {
            currentMap: nextMapKey,
            positionX: nextX,
            positionY: nextY,
          },
        );
      }),
  );

  return relocatedNpcs;
}

function normalizeChatHistoryRows(history: Row[]) {
  return history
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
    .flatMap((entry) => {
      const createdAt = entry.createdAt || new Date().toISOString();

      if (entry.role && entry.content) {
        return [
          {
            role: String(entry.role),
            content: String(entry.content),
            createdAt,
          },
        ];
      }

      const messages: Array<{ role: string; content: string; createdAt: string }> = [];

      if (entry.message) {
        messages.push({
          role: 'user',
          content: String(entry.message),
          createdAt,
        });
      }

      if (entry.reply) {
        messages.push({
          role: 'assistant',
          content: String(entry.reply),
          createdAt,
        });
      }

      return messages;
    });
}

function parseStoredAppearance(characterAppearance: unknown) {
  if (!characterAppearance) {
    return null;
  }

  if (typeof characterAppearance === 'string') {
    const trimmed = characterAppearance.trim();
    if (!trimmed.startsWith('{')) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (typeof characterAppearance === 'object') {
    return characterAppearance;
  }

  return null;
}

export const gameController = {
  async getProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const progress = await selectOne<Row>('GameProgress', {
        select: '*',
        ...eq('userId', userId),
      });

      if (!progress) {
        return res.status(404).json({ error: 'Progress not found' });
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get progress' });
    }
  },

  async updateProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { level, experience, gold, positionX, positionY, currentMap } = req.body;

      const [progress] = await updateRows<Row>(
        'GameProgress',
        { ...eq('userId', userId) },
        {
          ...(level !== undefined && { level }),
          ...(experience !== undefined && { experience }),
          ...(gold !== undefined && { gold }),
          ...(positionX !== undefined && { positionX }),
          ...(positionY !== undefined && { positionY }),
          ...(currentMap !== undefined && { currentMap }),
        },
      );

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update progress' });
    }
  },

  async getMap(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const progress = await selectOne<Row>('GameProgress', {
        select: '*',
        ...eq('userId', userId),
      });

      if (!progress) {
        return res.status(404).json({ error: 'Progress not found' });
      }

      const activeSharedMap = await selectOne<Row>('SharedMap', {
        select: '*',
        ...eq('isActive', true),
        order: order('updatedAt', false),
      });

      const preferredSharedMapId =
        typeof progress.currentMap === 'string' && progress.currentMap.startsWith('shared:')
          ? progress.currentMap.slice('shared:'.length)
          : null;

      let sharedMap = null;
      if (preferredSharedMapId) {
        sharedMap = await selectOne<Row>('SharedMap', {
          select: '*',
          ...eq('id', preferredSharedMapId),
        });
      }

      if (!sharedMap) {
        sharedMap = activeSharedMap ?? null;
      }

      let map = null;
      let isShared = false;
      let mapId: string | null = null;
      let viewedMapKey = 'main';

      if (sharedMap && sharedMap.mapData) {
        map = parseStoredMap(sharedMap.mapData);
        isShared = true;
        mapId = sharedMap.id;
        viewedMapKey = `shared:${sharedMap.id}`;

        if (sharedMap.id !== preferredSharedMapId) {
          await updateRows<Row>(
            'GameProgress',
            { ...eq('userId', userId) },
            { currentMap: `shared:${sharedMap.id}` },
          );
        }
      } else {
        // 回退到用户个人地图
        map = parseStoredMap(progress.currentMap);
        viewedMapKey =
          typeof progress.currentMap === 'string' && progress.currentMap
            ? progress.currentMap
            : 'main';
      }
      
      // 如果没有有效的地图数据，使用默认地图
      if (!map) {
        map = getDefaultMap();
      }

      const npcs = await buildMapNpcPayload(userId, map, viewedMapKey);

      res.json({
        hasCustomMap: Boolean(map),
        isShared,
        mapId,
        map,
        npcs,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get map' });
    }
  },

  async getPortalTarget(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const fromMapId = typeof req.query.fromMapId === 'string' ? req.query.fromMapId : '';
      const portalCode = typeof req.query.portalCode === 'string' ? req.query.portalCode.trim() : '';
      const currentPortalId =
        typeof req.query.currentPortalId === 'string' ? req.query.currentPortalId.trim() : '';

      console.log('[portal] resolve request', {
        userId,
        fromMapId,
        portalCode,
        currentPortalId,
      });

      if (!portalCode) {
        return res.status(400).json({ error: 'portalCode is required' });
      }

      const sharedMaps = await selectMany<Row>('SharedMap', {
        select: '*',
        order: order('updatedAt', false),
        limit: 100,
      });

      for (const sharedMap of sharedMaps) {
        if (!sharedMap?.id || !sharedMap.mapData) {
          continue;
        }

        const map = parseStoredMap(sharedMap.mapData);
        if (!map) {
          continue;
        }

        const destinationPortal = getPortalAreas(map).find((area) => {
          if (String(area.portalCode ?? '') !== portalCode) {
            return false;
          }

          if (
            sharedMap.id === fromMapId &&
            currentPortalId &&
            String(area.id ?? '') === currentPortalId
          ) {
            return false;
          }

          return true;
        });

        if (!destinationPortal) {
          console.log('[portal] no destination in map', {
            candidateMapId: sharedMap.id,
            portalCode,
            currentPortalId,
            portalCount: getPortalAreas(map).length,
          });
          continue;
        }

        console.log('[portal] destination resolved', {
          fromMapId,
          toMapId: sharedMap.id,
          portalCode,
          currentPortalId,
          destinationPortalId: destinationPortal.id ?? null,
        });

        const npcs = await buildMapNpcPayload(userId, map, `shared:${sharedMap.id}`);
        const spawnX = destinationPortal.x + destinationPortal.width / 2 - 24;
        const spawnY = destinationPortal.y + destinationPortal.height - 48;

        return res.json({
          isShared: true,
          mapId: sharedMap.id,
          map,
          npcs,
          spawn: {
            x: spawnX,
            y: spawnY,
            portalId: destinationPortal.id ?? null,
            portalCode: destinationPortal.portalCode ?? portalCode,
          },
        });
      }

      console.log('[portal] no matching portal found', {
        fromMapId,
        portalCode,
        currentPortalId,
      });
      return res.status(404).json({ error: 'No matching portal found' });
    } catch (error) {
      console.error('Get portal target error:', error);
      return res.status(500).json({ error: 'Failed to resolve portal target' });
    }
  },

  async saveMap(req: Request, res: Response) {
    try {
      const userId = (req as any).userId; // 可能为 undefined（公开路由）
      const { map, saveAsShared = false, mapName } = req.body;

      console.log('=== saveMap controller ===');
      console.log('userId:', userId);
      console.log('saveAsShared:', saveAsShared);
      console.log('mapName:', mapName);

      if (!map || typeof map !== 'object') {
        return res.status(400).json({ error: 'Map payload is required' });
      }

      if (!map.width || !map.height || !Array.isArray(map.layers)) {
        return res.status(400).json({ error: 'Invalid map format' });
      }

      const mapJson = JSON.stringify(map);

      if (saveAsShared) {
        // 保存为共享地图
        const finalMapName = mapName || 'main';
        
        // 检查是否已存在同名地图
        const existingMaps = await selectMany<Row>('SharedMap', { ...eq('name', finalMapName) });
        
        if (existingMaps && existingMaps.length > 0) {
          // 更新现有地图
          const [updatedMap] = await updateRows<Row>(
            'SharedMap',
            { ...eq('name', finalMapName) },
            { mapData: mapJson }
          );
          
          return res.json({
            message: 'Shared map updated successfully',
            isShared: true,
            mapId: updatedMap?.id,
            mapName: updatedMap?.name,
          });
        } else {
          // 创建新的共享地图
          const [sharedMap] = await insertRows<Row>('SharedMap', {
            name: finalMapName,
            mapData: mapJson,
            isActive: false,
            createdBy: userId || null, // 允许为 null
          });

          return res.json({
            message: 'Shared map saved successfully',
            isShared: true,
            mapId: sharedMap?.id,
            mapName: sharedMap?.name,
          });
        }
      } else {
        // 保存为个人地图（需要认证）
        if (!userId) {
          return res.status(401).json({ error: 'Authentication required for personal maps' });
        }
        
        const [progress] = await updateRows<Row>(
          'GameProgress',
          { ...eq('userId', userId) },
          { currentMap: mapJson },
        );

        res.json({
          message: 'Map saved successfully',
          isShared: false,
          currentMap: progress?.currentMap ?? null,
        });
      }
    } catch (error) {
      console.error('Save map error:', error);
      res.status(500).json({ error: 'Failed to save map' });
    }
  },

  async createTransaction(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { type, items, npcName } = req.body;

      if (!['buy', 'sell'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.price * item.quantity;
      }

      const progress = await selectOne<Row>('GameProgress', {
        select: '*',
        ...eq('userId', userId),
      });

      if (!progress) {
        return res.status(404).json({ error: 'Progress not found' });
      }

      const newGold = type === 'sell' ? progress.gold + totalAmount : progress.gold - totalAmount;

      if (newGold < 0) {
        return res.status(400).json({ error: 'Insufficient gold' });
      }

      const transactionId = crypto.randomUUID();
      const [transaction] = await insertRows<Row>('Transaction', {
        id: transactionId,
        userId,
        type,
        totalAmount,
        npcName,
      });

      const createdItems = await insertRows<Row>(
        'TransactionItem',
        items.map((item: any) => ({
          id: crypto.randomUUID(),
          transactionId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      );

      await updateRows<Row>('GameProgress', { ...eq('userId', userId) }, { gold: newGold });

      const products = createdItems.length
        ? await selectMany<Row>('Product', {
            select: '*',
            ...inList(
              'id',
              createdItems.map((item) => item.productId),
            ),
          })
        : [];

      const productMap = new Map(products.map((product) => [product.id, product]));

      res.json({
        ...transaction,
        items: createdItems.map((item) => ({
          ...item,
          product: productMap.get(item.productId) ?? null,
        })),
      });
    } catch (error) {
      console.error('Transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { limit = 20, offset = 0 } = req.query;

      const transactions = await selectMany<Row>('Transaction', {
        select: '*',
        ...eq('userId', userId),
        order: order('createdAt', false),
        limit: Number(limit),
        offset: Number(offset),
      });

      if (transactions.length === 0) {
        return res.json([]);
      }

      const items = await selectMany<Row>('TransactionItem', {
        select: '*',
        ...inList(
          'transactionId',
          transactions.map((transaction) => transaction.id),
        ),
      });

      const products = items.length
        ? await selectMany<Row>('Product', {
            select: '*',
            ...inList(
              'id',
              items.map((item) => item.productId),
            ),
          })
        : [];

      const productMap = new Map(products.map((product) => [product.id, product]));
      const itemsByTransaction = new Map<string, Row[]>();

      for (const item of items) {
        const list = itemsByTransaction.get(item.transactionId) || [];
        list.push({
          ...item,
          product: productMap.get(item.productId) ?? null,
        });
        itemsByTransaction.set(item.transactionId, list);
      }

      res.json(
        transactions.map((transaction) => ({
          ...transaction,
          items: itemsByTransaction.get(transaction.id) || [],
        })),
      );
    } catch (error) {
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  },

  async chatWithNpc(req: Request, res: Response) {
    try {
      const { npcId, message } = req.body || {};
      const visitorUserId = (req as any).userId;
      const visitorUser = await selectOne<Row>('User', {
        select: 'id,username,personalityTraits',
        ...eq('id', visitorUserId),
      });

      if (!npcId || typeof npcId !== 'string') {
        return res.status(400).json({ error: 'npcId is required' });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'message is required' });
      }

      if (npcId.startsWith('user-npc-')) {
        const ownerUserId = npcId.replace('user-npc-', '');
        const userNpc = await selectOne<Row>('User', {
          select: 'id,username,profession,interests,personaSummary,npcBehavior,secondmeAccessToken,secondmeApiKey,personalityTraits,currentMood,activityStatus',
          ...eq('id', ownerUserId),
        });

        if (!userNpc) {
          return res.status(404).json({ error: 'NPC not found' });
        }

        // 检查或创建关系
        let relationship = await selectOne<Row>('Relationship', {
          select: '*',
          ...eq('userId', ownerUserId),
          ...eq('targetUserId', visitorUserId),
        });

        const isFirstMeeting = !relationship;

        // 如果是第一次见面，创建关系
        if (isFirstMeeting) {
          // 解析性格特征
          const npcTraits = normalizePersonalityTraits(userNpc.personalityTraits);
          const visitorTraits = normalizePersonalityTraits(visitorUser?.personalityTraits);

          const { calculateInitialAffinity, determineRelationshipType } = await import('../lib/relationshipSystem');
          
          const initialAffinity = calculateInitialAffinity(
            npcTraits,
            visitorTraits,
            userNpc.currentMood || 'neutral',
            'neutral'
          );

          const relationshipType = determineRelationshipType(initialAffinity, 0);

          const [newRelationship] = await insertRows<Row>('Relationship', {
            id: crypto.randomUUID(),
            userId: ownerUserId,
            targetUserId: visitorUserId,
            affinity: initialAffinity,
            familiarity: 0,
            interactionCount: 0,
            relationshipType,
          });

          relationship = newRelationship;
        }

        // 判断是否接受互动
        const { shouldAcceptInteraction } = await import('../lib/relationshipSystem');
        
        const npcTraits = normalizePersonalityTraits(userNpc.personalityTraits);

        const acceptResult = shouldAcceptInteraction(
          npcTraits,
          userNpc.currentMood || 'neutral',
          50, // socialEnergy - 可以从NPC状态获取
          30, // stressLevel - 可以从NPC状态获取
          relationship as any,
          isFirstMeeting
        );

        if (!acceptResult.accept) {
          // 使用AI生成拒绝理由
          const { buildRejectionPrompt, generateRejectionWithAI, fallbackRejectionReason } = await import('../lib/aiRejectionReason');
          
          let rejectionReason = acceptResult.reason || '不好意思，我现在不太想聊天。';
          
          // 如果有rejectionType，尝试用AI生成更真实的拒绝理由
          if (acceptResult.rejectionType && userNpc.secondmeAccessToken) {
            const rejectionPrompt = buildRejectionPrompt(
              userNpc.username,
              {
                profession: userNpc.profession,
                interests: Array.isArray(userNpc.interests) ? userNpc.interests : [],
                personaSummary: userNpc.personaSummary,
                personalityTraits: userNpc.personalityTraits,
              },
              {
                currentMood: userNpc.currentMood,
                activityStatus: userNpc.activityStatus,
              },
              {
                isFirstMeeting,
                relationshipType: relationship?.relationshipType,
                reason: acceptResult.rejectionType,
              }
            );
            
            const aiReason = await generateRejectionWithAI(rejectionPrompt, userNpc.secondmeAccessToken);
            
            if (aiReason) {
              rejectionReason = aiReason;
            } else if (acceptResult.rejectionType) {
              // AI失败，使用回退方案
              rejectionReason = fallbackRejectionReason(acceptResult.rejectionType);
            }
          }
          
          return res.json({
            reply: rejectionReason,
            source: 'rejected',
            relationship: {
              affinity: relationship!.affinity,
              familiarity: relationship!.familiarity,
              relationshipType: relationship!.relationshipType,
            }
          });
        }

        // 同步SecondMe API Key
        if (userNpc.secondmeAccessToken && !userNpc.secondmeApiKey) {
          try {
            const syncedAvatar = await syncSecondMeAvatarApiKey(userNpc.secondmeAccessToken);
            if (syncedAvatar.secretKey) {
              const [updatedNpc] = await updateRows<Row>(
                'User',
                { ...eq('id', ownerUserId) },
                { secondmeApiKey: syncedAvatar.secretKey },
              );
              if (updatedNpc) {
                userNpc.secondmeApiKey = updatedNpc.secondmeApiKey;
              }
            }
          } catch (error) {
            console.warn(
              'SecondMe NPC api key sync skipped during chat:',
              error instanceof Error ? error.message : error,
            );
          }
        }

        // 加载聊天历史（用于上下文）
        let chatHistory: Array<{ role: string; content: string; createdAt: string }> = [];
        let memorySummaries: string[] = [];
        try {
          const history = await selectMany<Row>('ChatMessage', {
            select: 'id,message,reply,createdAt,source,aiReasoning',
            ...eq('userId', visitorUserId),
            ...eq('targetUserId', ownerUserId),
          });
          
          if (history && history.length > 0) {
            const { conversations, summaries } = splitChatRows(history as any);
            chatHistory = normalizeChatHistoryRows(conversations);
            memorySummaries = extractMemorySummaries(summaries as any);
            console.log(`📚 加载了 ${chatHistory.length} 条聊天历史用于上下文`);
          }
        } catch (error) {
          console.warn('加载聊天历史失败，将使用无上下文模式:', error);
        }

        // 生成NPC回复
        let reply: string | null = null;
        try {
          const npcProfile = {
            id: npcId,
            name: userNpc.username,
            profession: userNpc.profession,
            interests: userNpc.interests,
            personaSummary: userNpc.personaSummary,
            npcBehavior: userNpc.npcBehavior,
            sourceType: 'secondme' as const,
            secondmeAccessToken: userNpc.secondmeAccessToken,
            secondmeApiKey: userNpc.secondmeApiKey,
          };

          reply = userNpc.secondmeAccessToken
            ? userNpc.secondmeApiKey
            ? await requestSecondMeNpcReply(
                npcProfile,
                message,
                visitorUserId,
                visitorUser?.username || `player-${visitorUserId}`,
                chatHistory, // 传递聊天历史
                memorySummaries,
              )
            : await requestSecondMeDirectReply(
                npcProfile,
                message,
                chatHistory, // 传递聊天历史
                memorySummaries,
              )
            : null;
        } catch (error) {
          console.error('SecondMe NPC chat fallback:', error);
        }

        // 如果没有回复，使用本地回退
        if (!reply) {
          reply = buildLocalNpcReply(
            {
              id: npcId,
              name: userNpc.username,
              profession: userNpc.profession,
              interests: userNpc.interests,
              personaSummary: userNpc.personaSummary,
              npcBehavior: userNpc.npcBehavior,
            },
            message,
          );
        }

        // 现在有了回复，使用AI评估关系变化
        const { determineRelationshipType } = await import('../lib/relationshipSystem');
        const { buildEvaluationPrompt, evaluateWithAI, fallbackEvaluation } = await import('../lib/aiRelationshipEvaluator');
        
        const visitorTraits = normalizePersonalityTraits(visitorUser?.personalityTraits);

        // 构建AI评估提示（现在有完整的对话内容）
        const evaluationPrompt = buildEvaluationPrompt(
          userNpc.username,
          {
            profession: userNpc.profession,
            interests: Array.isArray(userNpc.interests) ? userNpc.interests : [],
            personaSummary: userNpc.personaSummary,
            personalityTraits: userNpc.personalityTraits,
          },
          {
            affinity: relationship!.affinity,
            familiarity: relationship!.familiarity,
            relationshipType: relationship!.relationshipType,
          },
          userNpc.currentMood || 'neutral',
          message,
          reply
        );

        // 尝试使用AI评估
        let evaluation = await evaluateWithAI(evaluationPrompt, userNpc.secondmeAccessToken);

        // 如果AI评估失败，使用回退方案
        if (!evaluation) {
          evaluation = fallbackEvaluation(
            message,
            reply,
            Array.isArray(userNpc.interests) ? userNpc.interests : [],
            userNpc.currentMood || 'neutral'
          );
        }

        // 计算新的好感度和熟悉度（都由AI评判）
        const affinityChange = evaluation.affinityChange;
        const familiarityChange = evaluation.familiarityChange;

        const newAffinity = Math.max(-100, Math.min(100, relationship!.affinity + affinityChange));
        const newFamiliarity = Math.max(0, Math.min(100, relationship!.familiarity + familiarityChange));
        const newRelationshipType = determineRelationshipType(newAffinity, newFamiliarity);

        // 更新关系（访问者→NPC）
        await updateRows<Row>(
          'Relationship',
          { ...eq('id', relationship!.id) },
          {
            affinity: newAffinity,
            familiarity: newFamiliarity,
            relationshipType: newRelationshipType,
            interactionCount: relationship!.interactionCount + 1,
            lastInteractionAt: new Date().toISOString(),
          }
        );

        // 更新反向关系（NPC→访问者）- 熟悉度是相互的
        const reverseRelationship = await selectOne<Row>('Relationship', {
          select: '*',
          ...eq('userId', ownerUserId),
          ...eq('targetUserId', visitorUserId),
        });

        if (reverseRelationship) {
          // 反向关系已存在，更新熟悉度（熟悉度相互增长）
          const reverseFamiliarity = Math.max(0, Math.min(100, reverseRelationship.familiarity + familiarityChange));
          // 好感度可能不同（NPC对玩家的好感度由AI单独评估）
          const reverseRelationshipType = determineRelationshipType(reverseRelationship.affinity, reverseFamiliarity);
          
          await updateRows<Row>(
            'Relationship',
            { ...eq('id', reverseRelationship.id) },
            {
              familiarity: reverseFamiliarity,
              relationshipType: reverseRelationshipType,
              interactionCount: reverseRelationship.interactionCount + 1,
              lastInteractionAt: new Date().toISOString(),
            }
          );
        } else {
          // 反向关系不存在，创建它
          const reverseAffinityChange = evaluation.affinityChange; // 使用相同的好感度变化
          const reverseAffinity = Math.max(-100, Math.min(100, 0 + reverseAffinityChange));
          const reverseFamiliarity = Math.max(0, Math.min(100, 0 + familiarityChange));
          const reverseRelationshipType = determineRelationshipType(reverseAffinity, reverseFamiliarity);
          
          await insertRows<Row>('Relationship', {
            id: crypto.randomUUID(),
            userId: ownerUserId,
            targetUserId: visitorUserId,
            affinity: reverseAffinity,
            familiarity: reverseFamiliarity,
            relationshipType: reverseRelationshipType,
            interactionCount: 1,
            lastInteractionAt: new Date().toISOString(),
          });
        }

        // 更新NPC的心情和状态
        await updateRows<Row>(
          'User',
          { ...eq('id', ownerUserId) },
          {
            currentMood: evaluation.newMood,
            activityStatus: evaluation.newActivityStatus,
          }
        );

        // 记录互动历史
        try {
          await insertRows<Row>('InteractionHistory', {
            id: crypto.randomUUID(),
            relationshipId: relationship!.id,
            interactionType: 'chat',
            affinityChange,
            familiarityChange,
            note: evaluation.reasoning,
          });
        } catch (error) {
          // 忽略历史记录错误
        }

        // 保存聊天记录到数据库
        const replySource = userNpc.secondmeApiKey ? 'secondme-visitor' : 'secondme-chat';
        try {
          console.log('💾 正在保存聊天记录到数据库...');
          await insertRows<Row>('ChatMessage', {
            id: crypto.randomUUID(),
            userId: visitorUserId,
            targetUserId: ownerUserId,
            message,
            reply,
            source: replySource,
            affinity: newAffinity,
            familiarity: newFamiliarity,
            relationshipType: newRelationshipType,
            affinityChange,
            familiarityChange,
            aiReasoning: evaluation.reasoning,
            aiEmotionalResponse: evaluation.emotionalResponse,
            npcMoodBefore: userNpc.currentMood || 'neutral',
            npcMoodAfter: evaluation.newMood,
            npcStatusBefore: userNpc.activityStatus || 'idle',
            npcStatusAfter: evaluation.newActivityStatus,
          });
          console.log('✅ 聊天记录保存成功');

          try {
            const allRows = await selectMany<Row>('ChatMessage', {
              select: 'id,userId,targetUserId,message,reply,createdAt,source,aiReasoning',
              ...eq('userId', visitorUserId),
              ...eq('targetUserId', ownerUserId),
              order: order('createdAt', true),
            });

            const savedSummary = await persistConversationMemorySummary(allRows as any);
            if (savedSummary?.reply) {
              try {
                await syncConversationMemoryToSecondMeNote(
                  userNpc.secondmeAccessToken,
                  userNpc.username,
                  String(savedSummary.reply),
                );
              } catch (noteError) {
                console.warn(
                  'SecondMe note sync skipped:',
                  noteError instanceof Error ? noteError.message : noteError,
                );
              }
            }
          } catch (memoryError) {
            console.warn(
              'Conversation memory summary skipped:',
              memoryError instanceof Error ? memoryError.message : memoryError,
            );
          }
        } catch (error) {
          console.error('❌ Failed to save chat message:', error);
          // 不影响主流程，继续返回结果
        }

        // 返回回复和关系信息
        return res.json({
          reply,
          source: replySource,
          relationship: {
            affinity: newAffinity,
            familiarity: newFamiliarity,
            relationshipType: newRelationshipType,
            affinityChange,
            familiarityChange,
          },
          aiEvaluation: {
            reasoning: evaluation.reasoning,
            emotionalResponse: evaluation.emotionalResponse,
            newMood: evaluation.newMood,
            newActivityStatus: evaluation.newActivityStatus,
          }
        });
      }

      return res.status(404).json({ error: 'NPC not found' });
    } catch (error) {
      console.error('NPC chat error:', error);
      res.status(500).json({ error: 'Failed to chat with npc' });
    }
  },

  async getRelationships(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      // 获取该用户与其他用户的所有关系
      const relationships = await selectMany<Row>('Relationship', {
        select: '*',
        ...eq('targetUserId', userId),
        order: order('updatedAt', false),
        limit: 50,
      });

      // 获取关系对应的用户信息
      if (relationships.length > 0) {
        const userIds = relationships.map(r => r.userId);
        const users = await selectMany<Row>('User', {
          select: 'id,username,avatar,profession',
          ...inList('id', userIds),
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        const enrichedRelationships = relationships.map(r => ({
          ...r,
          user: userMap.get(r.userId) || null,
        }));

        return res.json(enrichedRelationships);
      }

      res.json([]);
    } catch (error) {
      console.error('Get relationships error:', error);
      res.status(500).json({ error: 'Failed to get relationships' });
    }
  },

  async getChatHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      let { targetUserId, limit = 50, offset = 0 } = req.query;

      console.log(`📖 加载聊天历史: userId=${userId}, targetUserId=${targetUserId}`);

      if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId is required' });
      }

      // 如果targetUserId包含user-npc-前缀，去掉它
      let actualTargetUserId = targetUserId as string;
      if (actualTargetUserId.startsWith('user-npc-')) {
        actualTargetUserId = actualTargetUserId.replace('user-npc-', '');
        console.log(`🔄 转换NPC ID: ${targetUserId} -> ${actualTargetUserId}`);
      }

      // 获取聊天记录（双向）
      const messages = await selectMany<Row>('ChatMessage', {
        select: '*',
        order: order('createdAt', false),
        limit: Number(limit),
        offset: Number(offset),
      });

      console.log(`📊 从数据库查询到 ${messages.length} 条记录`);

      // 过滤出与目标用户的对话
      const filteredMessages = messages.filter(
        (msg) =>
          msg.source !== MEMORY_SUMMARY_SOURCE &&
          (
            (msg.userId === userId && msg.targetUserId === actualTargetUserId) ||
            (msg.userId === actualTargetUserId && msg.targetUserId === userId)
          )
      );

      console.log(`✅ 过滤后有 ${filteredMessages.length} 条相关记录`);

      res.json(filteredMessages);
    } catch (error) {
      console.error('❌ Get chat history error:', error);
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  },

  async updateNpcStates(req: Request, res: Response) {
    try {
      // 获取所有可见的NPC用户
      const npcs = await selectMany<Row>('User', {
        select: 'id,username,profession,interests,personaSummary,personalityTraits,currentMood,activityStatus,secondmeAccessToken',
        ...eq('isNpcVisible', true),
        limit: 20,
      });

      const { buildStateUpdatePrompt, updateStateWithAI, fallbackStateUpdate } = await import('../lib/aiNpcState');
      
      const updates = [];

      for (const npc of npcs) {
        // 构建状态更新提示
        const prompt = buildStateUpdatePrompt(
          npc.username,
          {
            profession: npc.profession,
            interests: Array.isArray(npc.interests) ? npc.interests : [],
            personaSummary: npc.personaSummary,
            personalityTraits: npc.personalityTraits,
          },
          {
            currentMood: npc.currentMood,
            activityStatus: npc.activityStatus,
          }
        );

        // 尝试使用AI更新
        let result = await updateStateWithAI(prompt, npc.secondmeAccessToken);

        // 如果AI失败，使用回退方案
        if (!result) {
          result = fallbackStateUpdate(npc.personalityTraits, npc.currentMood);
        }

        // 更新数据库
        await updateRows<Row>(
          'User',
          { ...eq('id', npc.id) },
          {
            currentMood: result.currentMood,
            activityStatus: result.activityStatus,
          }
        );

        updates.push({
          npcId: npc.id,
          npcName: npc.username,
          oldMood: npc.currentMood,
          newMood: result.currentMood,
          oldStatus: npc.activityStatus,
          newStatus: result.activityStatus,
          reasoning: result.reasoning,
        });
      }

      res.json({
        message: 'NPC states updated',
        updates,
      });
    } catch (error) {
      console.error('Update NPC states error:', error);
      res.status(500).json({ error: 'Failed to update NPC states' });
    }
  },

  // NPC 传送到另一张地图
  async teleportNpc(req: Request, res: Response) {
    try {
      const { npcUserId, targetMapKey, spawnX, spawnY, portalCode } = req.body;

      if (!npcUserId || !targetMapKey) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // 更新 NPC 的地图位置
      const [updated] = await updateRows<Row>(
        'GameProgress',
        { ...eq('userId', npcUserId) },
        {
          currentMap: targetMapKey,
          positionX: spawnX ?? 96,
          positionY: spawnY ?? 96,
        }
      );

      if (!updated) {
        return res.status(404).json({ error: 'NPC progress not found' });
      }

      console.log(`🚪 NPC ${npcUserId} 传送到地图 ${targetMapKey}，位置 (${spawnX}, ${spawnY})，传送门 ${portalCode}`);

      res.json({
        success: true,
        npcUserId,
        targetMapKey,
        spawnX,
        spawnY,
        portalCode,
      });
    } catch (error) {
      console.error('Teleport NPC error:', error);
      res.status(500).json({ error: 'Failed to teleport NPC' });
    }
  },

  // 获取所有可见NPC的当前状态
  async getNpcStates(req: Request, res: Response) {
    try {
      const npcs = await selectMany<Row>('User', {
        select: 'id,username,currentMood,activityStatus',
        ...eq('isNpcVisible', true),
        limit: 50,
      });

      const states = npcs.map(npc => ({
        npcId: npc.id,
        npcName: npc.username,
        currentMood: npc.currentMood,
        activityStatus: npc.activityStatus,
      }));

      res.json({ states });
    } catch (error) {
      console.error('Get NPC states error:', error);
      res.status(500).json({ error: 'Failed to get NPC states' });
    }
  },

  // 获取角色外观
  async getCharacterAppearance(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const progress = await selectOne<Row>('GameProgress', {
        select: 'characterAppearance',
        ...eq('userId', userId),
      });

      if (!progress) {
        return res.json({ appearance: null });
      }

      res.json({ appearance: parseStoredAppearance(progress.characterAppearance) });
    } catch (error) {
      console.error('Get character appearance error:', error);
      res.status(500).json({ error: 'Failed to get character appearance' });
    }
  },

  // 更新角色外观
  async updateCharacterAppearance(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { appearance } = req.body;

      // 验证外观数据
      if (!appearance || typeof appearance !== 'object') {
        return res.status(400).json({ error: 'Invalid appearance data' });
      }

      const requiredFields = ['character', 'tops', 'bottoms', 'shoes', 'hair', 'eyes'];
      for (const field of requiredFields) {
        if (typeof appearance[field] !== 'number') {
          return res.status(400).json({ error: `Missing or invalid field: ${field}` });
        }
      }

      // 确保GameProgress存在
      const existing = await selectOne<Row>('GameProgress', {
        select: 'id',
        ...eq('userId', userId),
      });

      if (!existing) {
        // 创建新的GameProgress
        await insertRows('GameProgress', [
          {
            userId,
            characterAppearance: appearance,
          },
        ]);
      } else {
        // 更新现有的
        await updateRows(
          'GameProgress',
          eq('userId', userId),
          { characterAppearance: appearance }
        );
      }

      res.json({ success: true, appearance });
    } catch (error) {
      console.error('Update character appearance error:', error);
      res.status(500).json({ error: 'Failed to update character appearance' });
    }
  },
};
