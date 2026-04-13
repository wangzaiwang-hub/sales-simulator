"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PersonalityTraits, Mood, ActivityStatus } from "@/types/npc-emotions";
import { getStatusDisplayText, getStatusColor } from "@/types/npc-emotions";
import { getRelationshipText, getAffinityText, getAffinityColor, getFamiliarityText } from "@/utils/relationship";

const apiUrl = "";
const tokenKey = "sales-simulator-token";
const CGS_CHARACTER_SPRITE = "CGS_RU_HouseFree/img/characters/CGS_Char_1.png";
const PLAYER_SPRITE_COLUMN_OFFSET = 0;
const PLAYER_CHARACTER_ROW = 4;

type Direction = "Front" | "Back" | "Left" | "Right";

type CharacterAppearance = {
  character: number;
  tops: number;
  bottoms: number;
  shoes: number;
  hair: number;
  eyes: number;
};

type Tile = {
  x: number;
  y: number;
  r?: number;
  fh?: boolean;
  fv?: boolean;
  collision?: boolean;
};

type Layer = {
  name: string;
  visible: boolean;
  tileset?: string;
  tileSize?: number;
  data: Tile[][];
};

type MapData = {
  width: number;
  height: number;
  tileSize: number;
  tileset?: string;
  layers: Layer[];
};

type Progress = {
  positionX: number;
  positionY: number;
  gold: number;
  currentMap: string;
};

type MeResponse = {
  id: string;
  username: string;
  avatar?: string | null;
  gameProgress: Progress | null;
};

type NpcBehavior = "wander" | "patrol" | "socialize" | "shopkeep" | "guard";

type ActorState = {
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
};

type NpcState = ActorState & {
  id: string;
  ownerUserId?: string | null;
  sourceType?: "static" | "secondme";
  name: string;
  role?: string;
  profession?: string;
  interests?: string[];
  bio?: string;
  avatar?: string | null;
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
  personalityTraits?: PersonalityTraits;
  currentMood?: Mood;
  activityStatus?: ActivityStatus;
  socialEnergy?: number;
  stressLevel?: number;
  interactingWithNpcId?: string | null;
  // 新增角色外观配置
  appearance?: CharacterAppearance;
};

type MapResponse = {
  hasCustomMap: boolean;
  map: MapData | null;
  npcs?: NpcState[];
  error?: string;
};

type ChatMessage = {
  role: "user" | "npc";
  text: string;
  relationship?: {
    affinity: number;
    familiarity: number;
    relationshipType: string;
    affinityChange?: number;
    familiarityChange?: number;
  };
  aiEvaluation?: {
    reasoning: string;
    emotionalResponse: string;
    newMood: string;
    newActivityStatus: string;
  };
};

function toAssetUrl(path?: string) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  
  // 移除resource/前缀（如果存在）
  const cleanPath = path.replace(/^resource\//, '');
  
  // 直接使用前端public目录的相对路径
  return `/${cleanPath.replace(/^\//, "")}`;
}

function createPlayer(x: number, y: number): ActorState {
  return {
    x,
    y,
    width: 48,
    height: 48,
    speed: 2.5,
    direction: "Front",
    currentFrame: 1,
    frameCount: 0,
    animationSpeed: 6,
    isMoving: false,
    collisionWidth: 24,
    collisionHeight: 16,
    collisionOffsetX: 12,
    collisionOffsetY: 32,
  };
}

function hydrateNpcRoster(npcs: NpcState[] | undefined, tileSize: number, mapWidth: number, mapHeight: number) {
  if (!npcs?.length) {
    return [];
  }

  return npcs.map((npc) => ({
    ...npc,
    currentFrame: npc.currentFrame ?? 1,
    frameCount: npc.frameCount ?? 0,
    animationSpeed: npc.animationSpeed ?? 10,
    isMoving: false,
    moveTimer: npc.moveTimer ?? 0,
    moveInterval: npc.moveInterval ?? 90,
    idleChance: npc.idleChance ?? 0.35,
    behavior: npc.behavior ?? "wander",
    anchorX: npc.anchorX ?? npc.x,
    anchorY: npc.anchorY ?? npc.y,
    roamRadius: npc.roamRadius ?? tileSize * 3,
  }));
}

// 检测并修复玩家与NPC重叠
function fixPlayerNpcOverlap(player: ActorState, npcs: NpcState[]) {
  const playerBounds = {
    x: player.x + player.collisionOffsetX,
    y: player.y + player.collisionOffsetY,
    width: player.collisionWidth,
    height: player.collisionHeight,
  };

  for (const npc of npcs) {
    const npcBounds = {
      x: npc.x + npc.collisionOffsetX,
      y: npc.y + npc.collisionOffsetY,
      width: npc.collisionWidth,
      height: npc.collisionHeight,
    };

    // 检测重叠
    if (
      playerBounds.x < npcBounds.x + npcBounds.width &&
      playerBounds.x + playerBounds.width > npcBounds.x &&
      playerBounds.y < npcBounds.y + npcBounds.height &&
      playerBounds.y + playerBounds.height > npcBounds.y
    ) {
      // 计算推开方向（将NPC推离玩家）
      const centerX = playerBounds.x + playerBounds.width / 2;
      const centerY = playerBounds.y + playerBounds.height / 2;
      const npcCenterX = npcBounds.x + npcBounds.width / 2;
      const npcCenterY = npcBounds.y + npcBounds.height / 2;
      
      const dx = npcCenterX - centerX;
      const dy = npcCenterY - centerY;
      const distance = Math.hypot(dx, dy);
      
      if (distance > 0) {
        // 推开距离：至少48像素（一个tile）
        const pushDistance = 48;
        npc.x += (dx / distance) * pushDistance;
        npc.y += (dy / distance) * pushDistance;
      }
    }
  }
}

export default function GamePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const playerRef = useRef<ActorState>(createPlayer(96, 96));
  const npcsRef = useRef<NpcState[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const mapRef = useRef<MapData | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState("正在加载游戏...");
  const [username, setUsername] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [playerAppearance, setPlayerAppearance] = useState<CharacterAppearance | null>(null);
  const [gold, setGold] = useState<number>(0);
  const [hasMap, setHasMap] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [presenceTick, setPresenceTick] = useState(0);
  const [immersiveMode, setImmersiveMode] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const selectedNpc = npcsRef.current.find((npc) => npc.id === selectedNpcId) || null;

  // 定期更新NPC状态（每30秒）
  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token || !hasMap) return;

    const updateNpcStates = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/game/npc-states-public`);

        if (!response.ok) return;

        const data = await response.json() as { states: Array<{ npcId: string; npcName: string; currentMood: string; activityStatus: string }> };

        // 更新NPC状态
        for (const state of data.states) {
          const npc = npcsRef.current.find(n => n.id === state.npcId);
          if (npc) {
            npc.currentMood = state.currentMood as Mood;
            npc.activityStatus = state.activityStatus as ActivityStatus;
          }
        }
      } catch (error) {
        console.error('Failed to update NPC states:', error);
      }
    };

    // 立即执行一次
    void updateNpcStates();

    // 每30秒更新一次
    const interval = setInterval(() => {
      void updateNpcStates();
    }, 30000);

    return () => clearInterval(interval);
  }, [hasMap]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatScrollRef.current && selectedNpcId && chatMessages[selectedNpcId]?.length > 0) {
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [chatMessages, selectedNpcId]);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    const load = async () => {
      try {
        const [meRes, mapRes, appearanceRes] = await Promise.all([
          fetch(`${apiUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/game/map`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/game/character-appearance`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const me = (await meRes.json()) as MeResponse;
        const mapPayload = (await mapRes.json()) as MapResponse;
        const appearanceData = await appearanceRes.json();

        if (!meRes.ok) {
          throw new Error(meRes.status === 401 ? "登录状态失效，请重新登录" : "读取用户信息失败");
        }

        if (!mapRes.ok) {
          throw new Error(mapPayload.error || "读取地图失败");
        }

        setUsername(me.username);
        setUserAvatar(me.avatar || null);
        setGold(me.gameProgress?.gold ?? 0);
        
        // 如果没有角色外观，跳转到角色创建页面
        if (!appearanceData.appearance) {
          router.replace("/character-creator");
          return;
        }
        
        setPlayerAppearance(appearanceData.appearance);
        playerRef.current = createPlayer(me.gameProgress?.positionX ?? 96, me.gameProgress?.positionY ?? 96);

        if (!mapPayload.map) {
          setHasMap(false);
          setStatus("数据库里还没有地图，请先在 tileset-editor.html 保存地图。");
          return;
        }

        mapRef.current = mapPayload.map as MapData;
        npcsRef.current = hydrateNpcRoster(
          mapPayload.npcs,
          mapPayload.map.tileSize || 48,
          mapPayload.map.width || 20,
          mapPayload.map.height || 20,
        );
        
        // 修复玩家与NPC重叠问题
        fixPlayerNpcOverlap(playerRef.current, npcsRef.current);
        
        setHasMap(true);
        setStatus("进入游戏中...");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "加载游戏失败");
      }
    };

    void load();
  }, [router]);

  useEffect(() => {
    if (!selectedNpcId) return;
    const exists = npcsRef.current.some((npc) => npc.id === selectedNpcId);
    if (!exists) {
      setSelectedNpcId(null);
    }
  }, [hasMap, selectedNpcId]);

  // 加载聊天历史
  const loadedHistoryRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!selectedNpcId) return;
    
    // 如果已经加载过这个NPC的历史，不重复加载
    if (loadedHistoryRef.current.has(selectedNpcId)) {
      return;
    }
    
    // 如果已经有聊天记录，不重复加载
    if (chatMessages[selectedNpcId] && chatMessages[selectedNpcId].length > 0) {
      loadedHistoryRef.current.add(selectedNpcId);
      return;
    }

    const loadChatHistory = async () => {
      const token = localStorage.getItem(tokenKey);
      if (!token) return;

      console.log(`🔵 前端：开始加载聊天历史，NPC ID: ${selectedNpcId}`);

      try {
        const response = await fetch(
          `${apiUrl}/api/game/chat-history?targetUserId=${selectedNpcId}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          console.error('🔴 前端：加载聊天历史失败', response.status);
          return;
        }

        const history = await response.json() as Array<{
          userId: string;
          targetUserId: string;
          message: string;
          reply: string;
          affinity?: number;
          familiarity?: number;
          relationshipType?: string;
          affinityChange?: number;
          familiarityChange?: number;
          aiReasoning?: string;
          aiEmotionalResponse?: string;
          createdAt: string;
        }>;

        console.log(`🔵 前端：收到 ${history.length} 条历史记录`, history);

        // 转换为ChatMessage格式
        const messages: ChatMessage[] = [];
        for (const record of history.reverse()) { // 反转顺序，最早的在前
          // 用户消息
          messages.push({
            role: 'user',
            text: record.message,
          });
          
          // NPC回复
          messages.push({
            role: 'npc',
            text: record.reply,
            relationship: record.affinity !== undefined ? {
              affinity: record.affinity,
              familiarity: record.familiarity || 0,
              relationshipType: record.relationshipType || 'stranger',
              affinityChange: record.affinityChange,
              familiarityChange: record.familiarityChange,
            } : undefined,
            aiEvaluation: record.aiReasoning ? {
              reasoning: record.aiReasoning,
              emotionalResponse: record.aiEmotionalResponse || '',
              newMood: '',
              newActivityStatus: '',
            } : undefined,
          });
        }

        console.log(`🔵 前端：转换后有 ${messages.length} 条消息`, messages);

        setChatMessages((prev) => ({
          ...prev,
          [selectedNpcId]: messages,
        }));
        
        console.log(`✅ 前端：聊天历史已设置到state`);
        
        // 标记为已加载
        loadedHistoryRef.current.add(selectedNpcId);
      } catch (error) {
        console.error('🔴 前端：加载聊天历史出错:', error);
      }
    };

    void loadChatHistory();
  }, [selectedNpcId]);

  useEffect(() => {
    if (!hasMap || !mapRef.current || !canvasRef.current) {
      return;
    }

    const map = mapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileSize = map.tileSize || 48;
    canvas.width = map.width * tileSize;
    canvas.height = map.height * tileSize;
    ctx.imageSmoothingEnabled = false;

    const imageCache = new Map<string, HTMLImageElement>();
    let interactionFrame = 0;

    const loadImage = (src: string) =>
      new Promise<void>((resolve) => {
        if (imageCache.has(src)) {
          resolve();
          return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageCache.set(src, img);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = src;
      });

    const actorBounds = (actor: ActorState, nextX = actor.x, nextY = actor.y) => ({
      x: nextX + actor.collisionOffsetX,
      y: nextY + actor.collisionOffsetY,
      width: actor.collisionWidth,
      height: actor.collisionHeight,
    });

    const intersects = (
      a: { x: number; y: number; width: number; height: number },
      b: { x: number; y: number; width: number; height: number },
    ) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    const isBlockedByMap = (bounds: { x: number; y: number; width: number; height: number }) => {
      if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > canvas.width || bounds.y + bounds.height > canvas.height) {
        return true;
      }

      const tileX1 = Math.floor(bounds.x / tileSize);
      const tileY1 = Math.floor(bounds.y / tileSize);
      const tileX2 = Math.floor((bounds.x + bounds.width - 1) / tileSize);
      const tileY2 = Math.floor((bounds.y + bounds.height - 1) / tileSize);

      for (let ty = tileY1; ty <= tileY2; ty += 1) {
        for (let tx = tileX1; tx <= tileX2; tx += 1) {
          for (const layer of map.layers) {
            if (!layer.visible) continue;
            const tile = layer.data?.[ty]?.[tx];
            if (tile?.collision && tile.x >= 0 && tile.y >= 0) {
              return true;
            }
          }
        }
      }

      return false;
    };

    const isBlockedByNpcs = (bounds: { x: number; y: number; width: number; height: number }, ignoreId?: string) =>
      npcsRef.current.some((npc) => npc.id !== ignoreId && intersects(bounds, actorBounds(npc)));

    const savePosition = () => {
      const token = localStorage.getItem(tokenKey);
      if (!token) return;

      fetch(`${apiUrl}/api/game/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          positionX: playerRef.current.x,
          positionY: playerRef.current.y,
        }),
      }).catch(() => {});
    };

    const queueSave = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(savePosition, 500);
    };

    const updateAnimationFrame = (actor: ActorState) => {
      actor.frameCount += 1;
      if (actor.frameCount < actor.animationSpeed) return;
      actor.frameCount = 0;
      actor.currentFrame = actor.isMoving ? (actor.currentFrame + 1) % 3 : 1;
    };

    const distanceToPlayer = (npc: NpcState) =>
      Math.hypot(
        npc.x + npc.width / 2 - (playerRef.current.x + playerRef.current.width / 2),
        npc.y + npc.height / 2 - (playerRef.current.y + playerRef.current.height / 2),
      );

    const getClosestInteractiveNpc = (maxDistance = 120) => {
      const closestNpc = [...npcsRef.current]
        .sort((a, b) => distanceToPlayer(a) - distanceToPlayer(b))
        .find((npc) => distanceToPlayer(npc) <= maxDistance);

      return closestNpc || null;
    };

    const drawLabel = (text: string, x: number, y: number, statusText?: string, statusColor?: string) => {
      ctx.save();
      
      // 绘制名字
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.lineWidth = 4;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      
      // 绘制状态（如果有）
      if (statusText) {
        const statusY = y - 16;
        ctx.font = "10px sans-serif";
        
        // 状态背景
        const textWidth = ctx.measureText(statusText).width;
        const padding = 6;
        const bgX = x - textWidth / 2 - padding;
        const bgY = statusY - 12;
        const bgWidth = textWidth + padding * 2;
        const bgHeight = 16;
        
        ctx.fillStyle = statusColor || "rgba(0, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 8);
        ctx.fill();
        
        // 状态文字
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeText(statusText, x, statusY);
        ctx.fillText(statusText, x, statusY);
      }
      
      ctx.restore();
    };

    const drawActorSprite = (
      actor: ActorState, 
      spriteColumnOffset: number, 
      characterRow: number, 
      label: string,
      npc?: NpcState,
      playerAppearanceOverride?: CharacterAppearance | null
    ) => {
      const directionMap: Record<Direction, number> = {
        Front: 0,
        Left: 1,
        Right: 2,
        Back: 3,
      };

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(actor.x + actor.width / 2, actor.y + actor.height + 2, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 优先使用外观配置渲染
      const appearance = playerAppearanceOverride || npc?.appearance;
      if (appearance) {
        drawLayeredCharacter(actor, appearance);
      } else {
        // 使用旧的精灵图渲染
        const sprite = imageCache.get(toAssetUrl(CGS_CHARACTER_SPRITE));
        if (sprite) {
          const row = characterRow + directionMap[actor.direction];
          const srcX = (spriteColumnOffset + actor.currentFrame) * 32;
          const srcY = row * 48;
          ctx.drawImage(sprite, srcX, srcY, 32, 48, actor.x, actor.y, actor.width, actor.height);
        } else {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(actor.x, actor.y, actor.width, actor.height);
        }
      }

      // 获取NPC状态文本和颜色
      let statusText: string | undefined;
      let statusColor: string | undefined;
      
      if (npc && npc.activityStatus && npc.currentMood) {
        statusText = getStatusDisplayText(npc.activityStatus, npc.currentMood);
        statusColor = getStatusColor(npc.activityStatus);
      }

      drawLabel(label, actor.x + actor.width / 2, actor.y - 6, statusText, statusColor);
    };

    // 绘制图层组合角色
    const drawLayeredCharacter = (actor: ActorState, appearance: CharacterAppearance) => {
      const directionMap: Record<Direction, string> = {
        Front: 'Front',
        Left: 'Left',
        Right: 'Right',
        Back: 'Back',
      };
      
      const direction = directionMap[actor.direction];
      const basePath = '/32x32%20Customizable%20Character%20Pack/Walk';
      
      // 图层绘制顺序（从下到上）
      const layers = [
        { folder: 'Character', file: 'Character_Walk', row: appearance.character },
        { folder: 'Clothing', file: 'Clothing_Shoes_Walk', row: appearance.shoes },
        { folder: 'Clothing', file: 'Clothing_Bottoms_Walk', row: appearance.bottoms },
        { folder: 'Clothing', file: 'Clothing_Tops_Walk', row: appearance.tops },
        { folder: 'Hair', file: 'Hair_Walk', row: appearance.hair },
        { folder: 'Eyes', file: 'Eyes_Walk', row: appearance.eyes },
      ];
      
      layers.forEach(layer => {
        // Eyes没有Back方向，使用Front代替
        const layerDirection = (layer.folder === 'Eyes' && direction === 'Back') ? 'Front' : direction;
        const imgPath = `${basePath}/${layer.folder}/${layer.file}_${layerDirection}-Sheet.png`;
        const img = imageCache.get(toAssetUrl(imgPath));
        
        if (img) {
          // 从精灵图的对应行读取当前帧
          const srcX = actor.currentFrame * 32;
          const srcY = layer.row * 32;
          ctx.drawImage(
            img,
            srcX, srcY, 32, 32,
            actor.x, actor.y, actor.width, actor.height
          );
        }
      });
    };

    const updatePlayer = () => {
      let dx = 0;
      let dy = 0;

      if (keysRef.current.ArrowUp || keysRef.current.w) dy -= playerRef.current.speed;
      if (keysRef.current.ArrowDown || keysRef.current.s) dy += playerRef.current.speed;
      if (keysRef.current.ArrowLeft || keysRef.current.a) dx -= playerRef.current.speed;
      if (keysRef.current.ArrowRight || keysRef.current.d) dx += playerRef.current.speed;

      if (dy < 0) playerRef.current.direction = "Back";
      else if (dy > 0) playerRef.current.direction = "Front";
      else if (dx < 0) playerRef.current.direction = "Left";
      else if (dx > 0) playerRef.current.direction = "Right";

      playerRef.current.isMoving = dx !== 0 || dy !== 0;

      if (!playerRef.current.isMoving) {
        updateAnimationFrame(playerRef.current);
        return;
      }

      const nextX = playerRef.current.x + dx;
      const nextY = playerRef.current.y + dy;
      const nextBounds = actorBounds(playerRef.current, nextX, nextY);

      if (!isBlockedByMap(nextBounds) && !isBlockedByNpcs(nextBounds)) {
        playerRef.current.x = nextX;
        playerRef.current.y = nextY;
        queueSave();
      } else {
        // 如果被NPC阻挡，尝试推开NPC
        const blockingNpc = npcsRef.current.find((npc) => intersects(nextBounds, actorBounds(npc)));
        if (blockingNpc) {
          // 计算推开方向
          const pushDx = dx !== 0 ? Math.sign(dx) * playerRef.current.speed * 1.5 : 0;
          const pushDy = dy !== 0 ? Math.sign(dy) * playerRef.current.speed * 1.5 : 0;
          
          const npcNextX = blockingNpc.x + pushDx;
          const npcNextY = blockingNpc.y + pushDy;
          const npcNextBounds = actorBounds(blockingNpc, npcNextX, npcNextY);
          
          // 如果NPC可以被推开，则推开NPC并移动玩家
          if (!isBlockedByMap(npcNextBounds) && !isBlockedByNpcs(npcNextBounds, blockingNpc.id)) {
            blockingNpc.x = npcNextX;
            blockingNpc.y = npcNextY;
            playerRef.current.x = nextX;
            playerRef.current.y = nextY;
            queueSave();
          }
        }
      }

      updateAnimationFrame(playerRef.current);
    };

    const updateNpcs = () => {
      const directions: Direction[] = ["Front", "Back", "Left", "Right"];

      for (const npc of npcsRef.current) {
        npc.moveTimer += 1;

        if (npc.moveTimer >= npc.moveInterval) {
          npc.moveTimer = 0;
          const dxToAnchor = npc.anchorX - npc.x;
          const dyToAnchor = npc.anchorY - npc.y;
          const distanceToAnchor = Math.hypot(dxToAnchor, dyToAnchor);
          const farFromAnchor = distanceToAnchor > npc.roamRadius;

          npc.isMoving = Math.random() >= npc.idleChance || farFromAnchor;

          if (npc.behavior === "guard") {
            npc.direction = Math.abs(dxToAnchor) > Math.abs(dyToAnchor)
              ? dxToAnchor >= 0 ? "Right" : "Left"
              : dyToAnchor >= 0 ? "Front" : "Back";
          } else if (npc.behavior === "shopkeep") {
            npc.direction = farFromAnchor
              ? (Math.abs(dxToAnchor) > Math.abs(dyToAnchor)
                  ? dxToAnchor >= 0 ? "Right" : "Left"
                  : dyToAnchor >= 0 ? "Front" : "Back")
              : ["Front", "Left", "Right"][Math.floor(Math.random() * 3)] as Direction;
          } else if (npc.behavior === "socialize") {
            npc.direction = Math.random() > 0.55
              ? (Math.abs(dxToAnchor) > Math.abs(dyToAnchor)
                  ? dxToAnchor >= 0 ? "Right" : "Left"
                  : dyToAnchor >= 0 ? "Front" : "Back")
              : directions[Math.floor(Math.random() * directions.length)];
          } else {
            npc.direction = directions[Math.floor(Math.random() * directions.length)];
          }
        }

        if (npc.isMoving) {
          let dx = 0;
          let dy = 0;

          if (npc.direction === "Back") dy -= npc.speed;
          if (npc.direction === "Front") dy += npc.speed;
          if (npc.direction === "Left") dx -= npc.speed;
          if (npc.direction === "Right") dx += npc.speed;

          const anchorDistanceAfterMove = Math.hypot((npc.x + dx) - npc.anchorX, (npc.y + dy) - npc.anchorY);
          if (anchorDistanceAfterMove > npc.roamRadius && npc.behavior !== "guard") {
            dx = npc.x < npc.anchorX ? npc.speed : npc.x > npc.anchorX ? -npc.speed : 0;
            dy = npc.y < npc.anchorY ? npc.speed : npc.y > npc.anchorY ? -npc.speed : 0;
          }

          const nextX = npc.x + dx;
          const nextY = npc.y + dy;
          const nextBounds = actorBounds(npc, nextX, nextY);

          if (!isBlockedByMap(nextBounds) && !isBlockedByNpcs(nextBounds, npc.id) && !intersects(nextBounds, actorBounds(playerRef.current))) {
            npc.x = nextX;
            npc.y = nextY;
          } else {
            npc.isMoving = false;
          }
        }

        updateAnimationFrame(npc);
      }
    };

    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const layer of map.layers) {
        if (!layer.visible || !layer.tileset) continue;

        const img = imageCache.get(toAssetUrl(layer.tileset));
        if (!img) continue;

        const layerTileSize = layer.tileSize || tileSize;
        for (let y = 0; y < map.height; y += 1) {
          for (let x = 0; x < map.width; x += 1) {
            const tile = layer.data?.[y]?.[x];
            if (!tile || tile.x < 0 || tile.y < 0) continue;

            ctx.save();
            ctx.translate(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
            ctx.rotate(((tile.r || 0) * Math.PI) / 180);
            ctx.scale(tile.fh ? -1 : 1, tile.fv ? -1 : 1);
            ctx.drawImage(
              img,
              tile.x * layerTileSize,
              tile.y * layerTileSize,
              layerTileSize,
              layerTileSize,
              -tileSize / 2,
              -tileSize / 2,
              tileSize,
              tileSize,
            );
            ctx.restore();
          }
        }
      }
    };

    const tick = () => {
      updatePlayer();
      updateNpcs();
      drawMap();

      for (const npc of npcsRef.current) {
        drawActorSprite(npc, npc.spriteColumnOffset, npc.characterRow, npc.name, npc);
      }

      drawActorSprite(playerRef.current, PLAYER_SPRITE_COLUMN_OFFSET, PLAYER_CHARACTER_ROW, username || "玩家", undefined, playerAppearance);
      interactionFrame += 1;
      if (interactionFrame % 15 === 0) {
        setPresenceTick((value) => value + 1);
      }
      animationRef.current = window.requestAnimationFrame(tick);
    };

    const prepare = async () => {
      // 收集所有需要加载的图片
      const sources = Array.from(
        new Set(
          [
            ...map.layers.map((layer) => layer.tileset).filter(Boolean),
            CGS_CHARACTER_SPRITE,
          ].map((path) => toAssetUrl(path)),
        ),
      );
      
      // 添加角色图层精灵图
      const basePath = '/32x32%20Customizable%20Character%20Pack/Walk';
      const directions = ['Front', 'Back', 'Left', 'Right'];
      const layerFiles = [
        { folder: 'Character', file: 'Character_Walk', hasAllDirections: true },
        { folder: 'Clothing', file: 'Clothing_Shoes_Walk', hasAllDirections: true },
        { folder: 'Clothing', file: 'Clothing_Bottoms_Walk', hasAllDirections: true },
        { folder: 'Clothing', file: 'Clothing_Tops_Walk', hasAllDirections: true },
        { folder: 'Hair', file: 'Hair_Walk', hasAllDirections: true },
        { folder: 'Eyes', file: 'Eyes_Walk', hasAllDirections: false }, // Eyes没有Back
      ];
      
      layerFiles.forEach(layer => {
        directions.forEach(direction => {
          // Eyes没有Back方向，跳过
          if (layer.folder === 'Eyes' && direction === 'Back') return;
          
          const imgPath = `${basePath}/${layer.folder}/${layer.file}_${direction}-Sheet.png`;
          sources.push(toAssetUrl(imgPath));
        });
      });

      await Promise.all(sources.map((src) => loadImage(src)));
      setStatus("游戏已加载，使用方向键或 WASD 移动角色。靠近 NPC 后按 C，或直接点击 NPC 对话。");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.key] = true;
      keysRef.current[event.key.toLowerCase()] = true;

      if (event.key.toLowerCase() === "c") {
        const nearestNpc = getClosestInteractiveNpc();
        if (nearestNpc) {
          setSelectedNpcId(nearestNpc.id);
        }
      }

      if (event.key === "Escape") {
        if (selectedNpcId) {
          setSelectedNpcId(null);
        } else {
          setImmersiveMode(false);
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key] = false;
      keysRef.current[event.key.toLowerCase()] = false;
    };

    const onCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (event.clientX - rect.left) * scaleX;
      const clickY = (event.clientY - rect.top) * scaleY;

      const clickedNpc = [...npcsRef.current]
        .reverse()
        .find((npc) => clickX >= npc.x && clickX <= npc.x + npc.width && clickY >= npc.y && clickY <= npc.y + npc.height);

      if (clickedNpc) {
        setSelectedNpcId(clickedNpc.id);
      }
    };

    void prepare().then(() => {
      animationRef.current = window.requestAnimationFrame(tick);
    });

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("click", onCanvasClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("click", onCanvasClick);
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      savePosition();
    };
  }, [hasMap, username]);

  const sendNpcMessage = async () => {
    const token = localStorage.getItem(tokenKey);
    const message = chatInput.trim();
    if (!token || !selectedNpc || !message || chatLoading) return;

    setChatLoading(true);
    setChatInput("");
    setChatMessages((prev) => ({
      ...prev,
      [selectedNpc.id]: [...(prev[selectedNpc.id] || []), { role: "user", text: message }],
    }));

    try {
      const response = await fetch(`${apiUrl}/api/game/npc-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          npcId: selectedNpc.id,
          message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "NPC 回复失败");
      }

      // 添加NPC回复，包含关系信息
      const npcMessage: ChatMessage = {
        role: "npc",
        text: data.reply || "...",
        relationship: data.relationship,
        aiEvaluation: data.aiEvaluation,
      };

      setChatMessages((prev) => ({
        ...prev,
        [selectedNpc.id]: [...(prev[selectedNpc.id] || []), npcMessage],
      }));
    } catch (error) {
      setChatMessages((prev) => ({
        ...prev,
        [selectedNpc.id]: [
          ...(prev[selectedNpc.id] || []),
          { role: "npc", text: error instanceof Error ? error.message : "NPC 暂时没有回应。" },
        ],
      }));
    } finally {
      setChatLoading(false);
    }
  };

  void presenceTick;

  const nearbyNpcs = npcsRef.current
    .filter((npc) => Math.hypot(npc.x - playerRef.current.x, npc.y - playerRef.current.y) < 180)
    .sort((a, b) => Math.hypot(a.x - playerRef.current.x, a.y - playerRef.current.y) - Math.hypot(b.x - playerRef.current.x, b.y - playerRef.current.y));
  const closestNpc = nearbyNpcs[0] || null;

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#09111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,_rgba(6,10,18,0.08),_rgba(3,8,20,0.52))]" />

      {hasMap ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} className="block max-h-full max-w-full bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)]" />
        </div>
      ) : (
        <div className="relative z-10 flex h-full items-center justify-center px-8 text-center text-slate-200">
          {status}
        </div>
      )}

      {immersiveMode && hasMap && (
        <>
          {closestNpc && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
              <div className="rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm text-slate-100 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md">
                靠近 {closestNpc.name} 后按 C 对话，或直接点击 TA
              </div>
            </div>
          )}
        </>
      )}

      {!immersiveMode && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-[rgba(3,8,20,0.42)] px-6 pt-10 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[rgba(8,15,30,0.92)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="text-[10px] uppercase tracking-[0.38em] text-cyan-200/70">Paused</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">退出沉浸模式</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">继续沉浸就返回地图，或者去编辑器、首页。</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setImmersiveMode(true)}
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                返回地图
              </button>
              <Link href="/character-creator" className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-100">
                角色工坊
              </Link>
              <Link href="/editor" className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-100">
                编辑地图
              </Link>
              <Link href="/" className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-100">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      )}

      {selectedNpc && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(5,10,20,0.35)] px-3 py-4">
          <div className="w-full max-w-[340px] h-[85vh] max-h-[720px] overflow-hidden rounded-[20px] border border-white/10 bg-[#f5f8ff] text-slate-900 shadow-[0_30px_90px_rgba(0,0,0,0.45)] flex flex-col relative">
            {/* 关闭按钮 - 右上角 */}
            <button
              type="button"
              onClick={() => setSelectedNpcId(null)}
              className="absolute top-1 right-1 z-50 rounded-full bg-black/20 w-6 h-6 flex items-center justify-center text-white hover:bg-black/40 transition backdrop-blur-sm"
              aria-label="关闭"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* 头部 - 极简布局 */}
            <div className="bg-[linear-gradient(135deg,_#12d6df,_#77f2c8)] px-3 py-2 text-slate-950">
              {/* 单行布局：NPC头像、进度条、玩家头像 - 居中对齐 */}
              <div className="flex items-center justify-center gap-3">
                {/* NPC头像 - 左边 */}
                <div className="flex-shrink-0">
                  {selectedNpc.avatar ? (
                    <img 
                      src={toAssetUrl(selectedNpc.avatar)} 
                      alt={selectedNpc.name}
                      className="w-9 h-9 rounded-full object-cover shadow-md"
                      onError={(e) => {
                        // 头像加载失败时显示首字母
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md"
                    style={{ display: selectedNpc.avatar ? 'none' : 'flex' }}
                  >
                    {selectedNpc.name?.[0]?.toUpperCase() || 'N'}
                  </div>
                </div>

                {/* 中间进度条区域 */}
                <div className="flex-1 min-w-0 max-w-[180px]">
                  {chatLoading ? (
                    // 正在输入中
                    <div className="text-center py-1">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/30 rounded-full">
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-[9px] text-slate-800 font-medium">输入中...</span>
                      </div>
                    </div>
                  ) : (
                    // 关系进度条
                    <>
                      {/* 好感度进度条 - 中间为0，左负右正 */}
                      <div className="mb-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-slate-800 font-medium">好感度</span>
                          <span className="text-[9px] text-slate-800 font-bold">
                            {(() => {
                              const messages = chatMessages[selectedNpc.id] || [];
                              const lastNpcMessage = [...messages].reverse().find(m => m.role === 'npc' && m.relationship);
                              return lastNpcMessage?.relationship?.affinity ?? 0;
                            })()}
                          </span>
                        </div>
                        <div className="relative h-1 bg-white/30 rounded-full overflow-hidden">
                          {/* 中间分界线 */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600/30 z-10"></div>
                          {/* 进度条 */}
                          <div 
                            className="absolute h-full transition-all duration-500"
                            style={(() => {
                              const messages = chatMessages[selectedNpc.id] || [];
                              const lastNpcMessage = [...messages].reverse().find(m => m.role === 'npc' && m.relationship);
                              const affinity = lastNpcMessage?.relationship?.affinity ?? 0;
                              
                              if (affinity >= 0) {
                                // 正值：从中间往右
                                return {
                                  left: '50%',
                                  width: `${(affinity / 100) * 50}%`,
                                  background: 'linear-gradient(to right, #fbbf24, #22c55e)'
                                };
                              } else {
                                // 负值：从中间往左
                                return {
                                  right: '50%',
                                  width: `${(Math.abs(affinity) / 100) * 50}%`,
                                  background: 'linear-gradient(to left, #fbbf24, #f87171)'
                                };
                              }
                            })()}
                          ></div>
                        </div>
                      </div>

                      {/* 熟悉度进度条 */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-slate-800 font-medium">熟悉度</span>
                          <span className="text-[9px] text-slate-800 font-bold">
                            {(() => {
                              const messages = chatMessages[selectedNpc.id] || [];
                              const lastNpcMessage = [...messages].reverse().find(m => m.role === 'npc' && m.relationship);
                              return lastNpcMessage?.relationship?.familiarity ?? 0;
                            })()}
                          </span>
                        </div>
                        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500"
                            style={{ 
                              width: `${(() => {
                                const messages = chatMessages[selectedNpc.id] || [];
                                const lastNpcMessage = [...messages].reverse().find(m => m.role === 'npc' && m.relationship);
                                return lastNpcMessage?.relationship?.familiarity ?? 0;
                              })()}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 玩家头像 - 右边 */}
                <div className="flex-shrink-0">
                  {userAvatar ? (
                    <img 
                      src={toAssetUrl(userAvatar)} 
                      alt={username}
                      className="w-9 h-9 rounded-full object-cover shadow-md"
                      onError={(e) => {
                        // 头像加载失败时显示首字母
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-md"
                    style={{ display: userAvatar ? 'none' : 'flex' }}
                  >
                    {username?.[0]?.toUpperCase() || 'P'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-[linear-gradient(180deg,_#eaf2ff,_#f8fbff)] p-3 overflow-hidden">
              <div ref={chatScrollRef} className="h-full overflow-auto rounded-[20px] border border-slate-200/80 bg-white/72 px-2.5 py-3 shadow-inner">
                {(chatMessages[selectedNpc.id] || []).length ? (
                  <div className="space-y-3">
                    {(chatMessages[selectedNpc.id] || []).map((item, index) => (
                      <div key={`${selectedNpc.id}-${index}`}>
                        <div
                          className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-[18px] px-3 py-2 text-[13px] leading-5 shadow-sm ${
                              item.role === "user"
                                ? "bg-[#9eea6a] text-slate-900"
                                : "border border-slate-200 bg-white text-slate-800"
                            }`}
                          >
                            {item.text}
                          </div>
                        </div>
                        {/* 显示关系变化 */}
                        {item.role === "npc" && item.relationship && (
                          <div className="mt-1 flex justify-start">
                            <div className="max-w-[82%] space-y-1 px-2">
                              {/* AI评估反馈 */}
                              {item.aiEvaluation && (
                                <div className="rounded-lg bg-slate-50 p-1.5 text-[10px]">
                                  {item.aiEvaluation.emotionalResponse && (
                                    <div className="mb-1 text-slate-600">
                                      💭 {item.aiEvaluation.emotionalResponse}
                                    </div>
                                  )}
                                  {item.aiEvaluation.reasoning && (
                                    <div className="text-slate-500">
                                      📝 {item.aiEvaluation.reasoning}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* 关系信息 */}
                              <div className="text-[9px] text-slate-400">
                                {item.relationship.relationshipType && (
                                  <span className="mr-2">
                                    关系: {getRelationshipText(item.relationship.relationshipType as any)}
                                  </span>
                                )}
                                {item.relationship.affinity !== undefined && (
                                  <span className="mr-2" style={{ color: getAffinityColor(item.relationship.affinity) }}>
                                    好感: {item.relationship.affinity} ({getAffinityText(item.relationship.affinity)})
                                    {item.relationship.affinityChange !== undefined && item.relationship.affinityChange !== 0 && (
                                      <span className={item.relationship.affinityChange > 0 ? "text-green-500" : "text-red-500"}>
                                        {" "}({item.relationship.affinityChange > 0 ? "+" : ""}{item.relationship.affinityChange})
                                      </span>
                                    )}
                                  </span>
                                )}
                                {item.relationship.familiarity !== undefined && (
                                  <span>
                                    熟悉度: {item.relationship.familiarity} ({getFamiliarityText(item.relationship.familiarity)})
                                    {item.relationship.familiarityChange !== undefined && item.relationship.familiarityChange !== 0 && (
                                      <span className="text-blue-500">
                                        {" "}(+{item.relationship.familiarityChange})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-500">
                    和 {selectedNpc.name} 打个招呼吧
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-3 pb-3 pt-2 flex-shrink-0">
              <div className="mb-1.5 text-[10px] text-slate-400">按 Enter 发送，按 Esc 关闭聊天</div>
              <div className="flex items-end gap-2">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendNpcMessage();
                    }
                  }}
                  rows={2}
                  placeholder={`给 ${selectedNpc.name} 发消息...`}
                  className="min-h-[44px] flex-1 resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400"
                />
                <button
                  type="button"
                  disabled={chatLoading || !chatInput.trim()}
                  onClick={() => void sendNpcMessage()}
                  className="rounded-[16px] bg-[#12d6df] px-4 py-2 text-[13px] font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {chatLoading ? "发送中" : "发送"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
