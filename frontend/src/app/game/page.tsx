"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { PersonalityTraits, Mood, ActivityStatus } from "@/types/npc-emotions";
import { getStatusDisplayText, getStatusColor } from "@/types/npc-emotions";
import { getRelationshipText, getAffinityText, getAffinityColor, getFamiliarityText } from "@/utils/relationship";
import { AssetCounter, AssetIconButton } from "@/components/game/mobile-casual-ui";
import { RpgButton, RpgKeyBadge, RpgLinkButton, RpgPromptPanel } from "@/components/game/rpg-ui";
import { getStoredAuthToken } from "@/lib/auth-storage";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const fallbackApiUrl =
  process.env.NEXT_PUBLIC_FALLBACK_API_URL?.trim() ||
  "https://backend-production-1dc96.up.railway.app";
const CGS_CHARACTER_SPRITE = "CGS_RU_HouseFree/img/characters/CGS_Char_1.png";
const PLAYER_SPRITE_COLUMN_OFFSET = 0;
const PLAYER_CHARACTER_ROW = 4;
const CANVAS_FONT_FAMILY = '"HanYi Pixel UI", "Microsoft YaHei", sans-serif';

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
  objects?: any[];
  portalAreas?: Array<{
    id?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    portalCode?: string | number;
  }>;
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
  resolvedMapKey?: string;
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
  mapId?: string | null;
  mapKey?: string | null;
  npcs?: NpcState[];
  error?: string;
};

type ChatMessage = {
  role: "user" | "npc";
  text: string;
  senderId: string; // ID of the user who sent this message
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

type JoystickState = {
  active: boolean;
  x: number;
  y: number;
};

function toAssetUrl(path?: string) {
  if (!path) return "";
  if (/^data:|^blob:/.test(path)) return path;

  let normalizedPath = path;

  if (/^https?:\/\//.test(normalizedPath)) {
    try {
      const url = new URL(normalizedPath);
      normalizedPath = `${url.pathname}${url.search}`;
    } catch {
      return normalizedPath;
    }
  }

  const cleanPath = normalizedPath
    .replace(/^resource\//, "")
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
  return `/${cleanPath}`;
}

function toAvatarUrl(path?: string) {
  if (!path) return "";
  if (/^data:|^blob:|^https?:\/\//.test(path)) {
    return path;
  }
  return toAssetUrl(path);
}

async function fetchGameApi(path: string, init?: RequestInit) {
  const useNetlifyProxy =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("netlify.app");

  const normalizedApiBase =
    typeof window !== "undefined" && apiUrl
      ? (() => {
          try {
            const configuredUrl = new URL(apiUrl, window.location.origin);
            return configuredUrl.origin === window.location.origin ? "" : apiUrl;
          } catch {
            return apiUrl;
          }
        })()
      : apiUrl;

  const primaryUrl = useNetlifyProxy
    ? `/.netlify/functions/api-proxy?path=${encodeURIComponent(path)}`
    : `${normalizedApiBase}${path}`;

  try {
    return await fetch(primaryUrl, init);
  } catch (error) {
    if (normalizedApiBase || useNetlifyProxy) {
      throw error;
    }

    const fallbackUrl = `${fallbackApiUrl}${path}`;
    console.warn(`Primary API request failed, fallback to direct backend: ${fallbackUrl}`);
    return fetch(fallbackUrl, init);
  }
}

async function parseApiResponse<T>(response: Response): Promise<{ data: T | null; rawText: string }> {
  const rawText = await response.text();

  if (!rawText) {
    return { data: null, rawText: "" };
  }

  try {
    return {
      data: JSON.parse(rawText) as T,
      rawText,
    };
  } catch {
    return {
      data: null,
      rawText,
    };
  }
}

function createPlayer(x: number, y: number): ActorState {
  return {
    x,
    y,
    width: 32,
    height: 32,
    speed: 2.5,
    direction: "Front",
    currentFrame: 1,
    frameCount: 0,
    animationSpeed: 6,
    isMoving: false,
    collisionWidth: 16,
    collisionHeight: 16,
    collisionOffsetX: 8,
    collisionOffsetY: 16,
  };
}

const GROUP_DEPTH_OFFSET = 3;

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

function mergeNpcRoster(
  currentNpcs: NpcState[],
  incomingNpcs: NpcState[] | undefined,
  tileSize: number,
  mapWidth: number,
  mapHeight: number,
) {
  const hydratedIncoming = hydrateNpcRoster(incomingNpcs, tileSize, mapWidth, mapHeight);

  if (!currentNpcs.length) {
    return hydratedIncoming;
  }

  const currentById = new Map(currentNpcs.map((npc) => [npc.id, npc]));

  return hydratedIncoming.map((incomingNpc) => {
    const currentNpc = currentById.get(incomingNpc.id);
    if (!currentNpc) {
      return incomingNpc;
    }

    return {
      ...incomingNpc,
      x: currentNpc.x,
      y: currentNpc.y,
      anchorX: currentNpc.anchorX ?? currentNpc.x,
      anchorY: currentNpc.anchorY ?? currentNpc.y,
      direction: currentNpc.direction,
      currentFrame: currentNpc.currentFrame,
      frameCount: currentNpc.frameCount,
      isMoving: currentNpc.isMoving,
      moveTimer: currentNpc.moveTimer,
    };
  });
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

// 检测并修复玩家与墙的碰撞
function fixPlayerWallCollision(player: ActorState, map: MapData) {
  if (!map?.objects) return;

  const playerBounds = {
    x: player.x + player.collisionOffsetX,
    y: player.y + player.collisionOffsetY,
    width: player.collisionWidth,
    height: player.collisionHeight,
  };

  const checkCollision = (obj: any): boolean => {
    if (obj.collision) {
      const collisionBounds = {
        x: obj.collision.x,
        y: obj.collision.y,
        width: obj.collision.width,
        height: obj.collision.height,
      };

      if (
        playerBounds.x < collisionBounds.x + collisionBounds.width &&
        playerBounds.x + playerBounds.width > collisionBounds.x &&
        playerBounds.y < collisionBounds.y + collisionBounds.height &&
        playerBounds.y + playerBounds.height > collisionBounds.y
      ) {
        return true;
      }
    }

    if (obj.isGroup && obj.children) {
      for (const child of obj.children) {
        if (checkCollision(child)) return true;
      }
    }

    return false;
  };

  let isColliding = false;
  for (const obj of map.objects) {
    if (checkCollision(obj)) {
      isColliding = true;
      break;
    }
  }

  if (isColliding) {
    // 尝试在附近找一个安全位置
    const tileSize = (map as any).gridSize || map.tileSize || 48;
    const maxX = ((map as any).cols || map.width || 20) * tileSize - player.width;
    const maxY = ((map as any).rows || map.height || 20) * tileSize - player.height;
    
    const tryPositions = [
      { x: player.x, y: player.y - tileSize }, // 上
      { x: player.x, y: player.y + tileSize }, // 下
      { x: player.x - tileSize, y: player.y }, // 左
      { x: player.x + tileSize, y: player.y }, // 右
      { x: player.x - tileSize, y: player.y - tileSize }, // 左上
      { x: player.x + tileSize, y: player.y - tileSize }, // 右上
      { x: player.x - tileSize, y: player.y + tileSize }, // 左下
      { x: player.x + tileSize, y: player.y + tileSize }, // 右下
      { x: tileSize * 2, y: tileSize * 2 }, // 左上角安全区
      { x: maxX - tileSize * 2, y: tileSize * 2 }, // 右上角安全区
    ];

    for (const pos of tryPositions) {
      if (pos.x < 0 || pos.x > maxX || pos.y < 0 || pos.y > maxY) continue;

      const testBounds = {
        x: pos.x + player.collisionOffsetX,
        y: pos.y + player.collisionOffsetY,
        width: player.collisionWidth,
        height: player.collisionHeight,
      };

      let testColliding = false;
      for (const obj of map.objects) {
        const testCheck = (o: any): boolean => {
          if (o.collision) {
            const cb = {
              x: o.collision.x,
              y: o.collision.y,
              width: o.collision.width,
              height: o.collision.height,
            };
            if (
              testBounds.x < cb.x + cb.width &&
              testBounds.x + testBounds.width > cb.x &&
              testBounds.y < cb.y + cb.height &&
              testBounds.y + testBounds.height > cb.y
            ) {
              return true;
            }
          }
          if (o.isGroup && o.children) {
            for (const child of o.children) {
              if (testCheck(child)) return true;
            }
          }
          return false;
        };

        if (testCheck(obj)) {
          testColliding = true;
          break;
        }
      }

      if (!testColliding) {
        player.x = pos.x;
        player.y = pos.y;
        return;
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
  const currentSharedMapIdRef = useRef<string | null>(null);
  const currentMapKeyRef = useRef<string>("main");
  const npcPositionSyncTimerRef = useRef<number | null>(null);
  const portalLockRef = useRef<string | null>(null);
  const teleportingRef = useRef(false);
  const npcPortalLockRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState("正在加载游戏...");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(""); // Current user's ID
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
  const [isTouchControlsEnabled, setIsTouchControlsEnabled] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [orientationHint, setOrientationHint] = useState("");
  const [portalDebugMessage, setPortalDebugMessage] = useState("");
  const [joystick, setJoystick] = useState<JoystickState>({ active: false, x: 0, y: 0 });
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const joystickPointerIdRef = useRef<number | null>(null);

  const selectedNpc = npcsRef.current.find((npc) => npc.id === selectedNpcId) || null;

  // 定期更新NPC状态（每30秒）
  useEffect(() => {
    const token = getStoredAuthToken();
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

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token || !hasMap) return;

    const syncNpcPositions = async () => {
      const occupants = npcsRef.current
        .filter((npc) => npc.ownerUserId)
        .map((npc) => ({
          npcUserId: npc.ownerUserId,
          currentMap:
            npc.resolvedMapKey ||
            (currentSharedMapIdRef.current
              ? `shared:${currentSharedMapIdRef.current}`
              : currentMapKeyRef.current),
          positionX: Math.round(npc.x),
          positionY: Math.round(npc.y),
        }));

      if (!occupants.length) return;

      try {
        const response = await fetchGameApi(`/api/game/sync-npc-positions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ occupants }),
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`sync-npc-positions ${response.status}: ${detail || "unknown error"}`);
        }
      } catch (error) {
        console.error("Failed to sync npc positions:", error);
      }
    };

    void syncNpcPositions();
    npcPositionSyncTimerRef.current = window.setInterval(() => {
      void syncNpcPositions();
    }, 1000);

    return () => {
      if (npcPositionSyncTimerRef.current) {
        window.clearInterval(npcPositionSyncTimerRef.current);
        npcPositionSyncTimerRef.current = null;
      }
    };
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
    const token = getStoredAuthToken();

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
        setUserId(me.id); // Store user ID
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
          setStatus("数据库里还没有地图，请先在地图编辑器中创建并保存地图。");
          return;
        }

        mapRef.current = mapPayload.map as MapData;
        currentSharedMapIdRef.current = mapPayload.mapId ?? null;
        currentMapKeyRef.current =
          mapPayload.mapKey ||
          (mapPayload.mapId ? `shared:${mapPayload.mapId}` : me.gameProgress?.currentMap || "main");
        npcsRef.current = hydrateNpcRoster(
          mapPayload.npcs,
          (mapPayload.map as any).gridSize || mapPayload.map.tileSize || 48,
          (mapPayload.map as any).cols || mapPayload.map.width || 20,
          (mapPayload.map as any).rows || mapPayload.map.height || 20,
        );
        
        // 修复玩家与墙的碰撞
        fixPlayerWallCollision(playerRef.current, mapRef.current);
        
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
    const token = getStoredAuthToken();
    if (!token || !hasMap) return;

    let cancelled = false;

    const syncMapRoster = async () => {
      try {
        const params = new URLSearchParams();
        if (currentSharedMapIdRef.current) {
          params.set("mapId", currentSharedMapIdRef.current);
        } else if (currentMapKeyRef.current) {
          params.set("mapKey", currentMapKeyRef.current);
        }

        const response = await fetchGameApi(`/api/game/map-roster?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const payload = await response.json() as { mapKey?: string; npcs?: NpcState[] };
        if (cancelled) return;

        const nextMapKey = payload.mapKey || currentMapKeyRef.current;
        const tileSize = ((mapRef.current as any)?.gridSize || mapRef.current?.tileSize || 48);
        const mapWidth = ((mapRef.current as any)?.cols || mapRef.current?.width || 20);
        const mapHeight = ((mapRef.current as any)?.rows || mapRef.current?.height || 15);

        npcsRef.current =
          nextMapKey !== currentMapKeyRef.current
            ? hydrateNpcRoster(payload.npcs, tileSize, mapWidth, mapHeight)
            : mergeNpcRoster(npcsRef.current, payload.npcs, tileSize, mapWidth, mapHeight);
        currentMapKeyRef.current = nextMapKey;
      } catch (error) {
        console.error("Failed to sync map roster:", error);
      }
    };

    void syncMapRoster();
    const interval = setInterval(() => {
      void syncMapRoster();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hasMap]);

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
      const token = getStoredAuthToken();
      if (!token) return;

      console.log(`🔵 前端：开始加载聊天历史，NPC ID: ${selectedNpcId}`);

      try {
        const response = await fetchGameApi(
          `/api/game/chat-history?targetUserId=${encodeURIComponent(selectedNpcId)}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          const { rawText } = await parseApiResponse(response);
          console.error('🔴 前端：加载聊天历史失败', response.status, rawText);
          return;
        }

        const { data } = await parseApiResponse<Array<{
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
        }>>(response);

        const history = data || [];

        console.log(`🔵 前端：收到 ${history.length} 条历史记录`, history);

        // 转换为ChatMessage格式
        const messages: ChatMessage[] = [];
        for (const record of history.reverse()) { // 反转顺序，最早的在前
          // 用户消息
          messages.push({
            role: 'user',
            text: record.message,
            senderId: record.userId, // Preserve sender ID
          });
          
          // NPC回复
          messages.push({
            role: 'npc',
            text: record.reply,
            senderId: record.targetUserId, // NPC is the sender of the reply
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
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateTouchControls = () => {
      setIsTouchControlsEnabled(mediaQuery.matches);
    };

    updateTouchControls();
    mediaQuery.addEventListener("change", updateTouchControls);

    return () => {
      mediaQuery.removeEventListener("change", updateTouchControls);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOrientationState = () => {
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      setIsPortraitMobile(isTouchDevice && window.innerHeight > window.innerWidth);
    };

    updateOrientationState();
    window.addEventListener("resize", updateOrientationState);
    window.addEventListener("orientationchange", updateOrientationState);

    return () => {
      window.removeEventListener("resize", updateOrientationState);
      window.removeEventListener("orientationchange", updateOrientationState);
    };
  }, []);

  const requestLandscapeMode = async () => {
    if (typeof window === "undefined") return false;

    try {
      const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      const screenOrientation = window.screen.orientation as ScreenOrientation & {
        lock?: (orientation: "landscape" | "portrait") => Promise<void>;
      };

      if (!document.fullscreenElement) {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        }
      }

      if (screenOrientation?.lock) {
        await screenOrientation.lock("landscape");
      }

      setOrientationHint("");
      return true;
    } catch {
      setOrientationHint("当前浏览器不允许自动锁定横屏，请先关闭系统方向锁定，再旋转设备。");
      return false;
    }
  };

  useEffect(() => {
    if (!isTouchControlsEnabled || !isPortraitMobile) return;
    void requestLandscapeMode();
  }, [isPortraitMobile, isTouchControlsEnabled]);

  useEffect(() => {
    if (!hasMap || !mapRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageCache = new Map<string, HTMLImageElement>();
    const pendingImageLoads = new Set<string>();
    let interactionFrame = 0;

    const getCurrentMap = () => mapRef.current;

    const getCurrentMapMetrics = (currentMap: MapData | null) => {
      const tileSize = (currentMap as any)?.gridSize || currentMap?.tileSize || 48;
      const mapCols = (currentMap as any)?.cols || currentMap?.width || 20;
      const mapRows = (currentMap as any)?.rows || currentMap?.height || 15;
      return { tileSize, mapCols, mapRows };
    };

    const syncCanvasToMap = (currentMap: MapData | null) => {
      const { tileSize, mapCols, mapRows } = getCurrentMapMetrics(currentMap);
      const nextWidth = mapCols * tileSize;
      const nextHeight = mapRows * tileSize;
      if (canvas.width !== nextWidth) {
        canvas.width = nextWidth;
      }
      if (canvas.height !== nextHeight) {
        canvas.height = nextHeight;
      }
      ctx.imageSmoothingEnabled = false;
      return { tileSize, mapCols, mapRows };
    };

    syncCanvasToMap(getCurrentMap());

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

    const ensureImage = (src?: string | null) => {
      if (!src) return null;
      const normalizedSrc = /^data:|^blob:/.test(src) ? src : toAssetUrl(src);
      const cached = imageCache.get(normalizedSrc);
      if (cached) {
        return cached;
      }
      if (!pendingImageLoads.has(normalizedSrc)) {
        pendingImageLoads.add(normalizedSrc);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          imageCache.set(normalizedSrc, img);
          pendingImageLoads.delete(normalizedSrc);
        };
        img.onerror = () => {
          pendingImageLoads.delete(normalizedSrc);
        };
        img.src = normalizedSrc;
      }
      return null;
    };

    const actorBounds = (actor: ActorState, nextX = actor.x, nextY = actor.y) => ({
      x: nextX + actor.collisionOffsetX,
      y: nextY + actor.collisionOffsetY,
      width: actor.collisionWidth,
      height: actor.collisionHeight,
    });

    // NPC 传送门检测和传送
    const checkNpcPortalTeleport = async (npc: NpcState) => {
      const currentMap = getCurrentMap();
      const portals = Array.isArray((currentMap as any)?.portalAreas) ? (currentMap as any).portalAreas : [];
      if (portals.length === 0) return;

      const npcBounds = actorBounds(npc);
      
      for (const portal of portals) {
        const portalBounds = {
          x: portal.x,
          y: portal.y,
          width: portal.width,
          height: portal.height,
        };

        if (intersects(npcBounds, portalBounds)) {
          const lockKey = `${npc.ownerUserId}:${portal.portalCode}`;
          
          // 如果这个 NPC 已经在这个传送门的锁定列表中，跳过
          if (npcPortalLockRef.current.has(lockKey)) {
            return;
          }

          // 添加锁定
          npcPortalLockRef.current.add(lockKey);

          try {
            const token = getStoredAuthToken();
            if (!token || !npc.ownerUserId) return;

            // 获取目标地图信息
            const targetResponse = await fetch(
              `${apiUrl}/api/game/portal-target?portalCode=${portal.portalCode}&fromMapId=${currentSharedMapIdRef.current || ""}&currentPortalId=${portal.id || ""}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!targetResponse.ok) return;

            const targetData = await targetResponse.json();
            if (!targetData.spawn) return;

            const spawnX = targetData.spawn.x;
            const spawnY = targetData.spawn.y;
            const targetMapKey = `shared:${targetData.mapId}`;

            // 调用后端 API 传送 NPC
            const teleportResponse = await fetch(`${apiUrl}/api/game/teleport-npc`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                npcUserId: npc.ownerUserId,
                targetMapKey,
                spawnX,
                spawnY,
                portalCode: portal.portalCode,
              }),
            });

            if (!teleportResponse.ok) {
              const errorPayload = await teleportResponse.json().catch(() => null);
              throw new Error(errorPayload?.error || "NPC 传送持久化失败");
            }

            const currentMapKey = currentSharedMapIdRef.current ? `shared:${currentSharedMapIdRef.current}` : null;
            if (targetMapKey === currentMapKey) {
              const resolvedSpawn = findNearestWalkablePosition(npc, spawnX, spawnY, npc.id, true) || {
                x: spawnX,
                y: spawnY,
              };
              npc.resolvedMapKey = targetMapKey;
              npc.x = resolvedSpawn.x;
              npc.y = resolvedSpawn.y;
              npc.anchorX = resolvedSpawn.x;
              npc.anchorY = resolvedSpawn.y;
            } else {
              // 跨图传送才从当前地图移除
              npcsRef.current = npcsRef.current.filter(n => n.id !== npc.id);
            }
            
            console.log(`🚪 NPC ${npc.name} 传送到地图 ${targetMapKey}`);
          } catch (error) {
            console.error("NPC portal teleport failed:", error);
          } finally {
            // 5秒后移除锁定
            setTimeout(() => {
              npcPortalLockRef.current.delete(lockKey);
            }, 5000);
          }

          return;
        }
      }
    };

    const intersects = (
      a: { x: number; y: number; width: number; height: number },
      b: { x: number; y: number; width: number; height: number },
    ) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    const isBlockedByMap = (bounds: { x: number; y: number; width: number; height: number }) => {
      const currentMap = getCurrentMap();
      const { tileSize } = getCurrentMapMetrics(currentMap);

      if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > canvas.width || bounds.y + bounds.height > canvas.height) {
        return true;
      }

      // 检查是否是新格式的地图
      const isNewFormat = (currentMap as any)?.objects && Array.isArray((currentMap as any)?.objects) && (currentMap as any).objects.length > 0;
      
      if (isNewFormat) {
        // 新格式：检查对象的碰撞框和独立碰撞区域
        const objects = ((currentMap as any)?.objects || []) as Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          collision?: { x: number; y: number; width: number; height: number };
          isGroup?: boolean;
          children?: any[];
        }>;
        
        const checkCollision = (obj: any): boolean => {
          if (obj.collision) {
            const collisionBounds = {
              x: obj.collision.x,
              y: obj.collision.y,
              width: obj.collision.width,
              height: obj.collision.height,
            };
            if (intersects(bounds, collisionBounds)) {
              return true;
            }
          }
          
          if (obj.isGroup && obj.children) {
            for (const child of obj.children) {
              if (checkCollision(child)) return true;
            }
          }
          
          return false;
        };
        
        for (const obj of objects) {
          if (checkCollision(obj)) return true;
        }
        
        // 检查独立碰撞区域
        const collisionAreas = ((currentMap as any)?.collisionAreas || []) as Array<{
          x: number;
          y: number;
          width: number;
          height: number;
        }> || [];
        
        for (const area of collisionAreas) {
          if (intersects(bounds, area)) {
            return true;
          }
        }
        
        return false;
      } else {
        // 旧格式：检查瓦片的碰撞属性
        const tileX1 = Math.floor(bounds.x / tileSize);
        const tileY1 = Math.floor(bounds.y / tileSize);
        const tileX2 = Math.floor((bounds.x + bounds.width - 1) / tileSize);
        const tileY2 = Math.floor((bounds.y + bounds.height - 1) / tileSize);

        for (let ty = tileY1; ty <= tileY2; ty += 1) {
          for (let tx = tileX1; tx <= tileX2; tx += 1) {
            for (const layer of currentMap?.layers || []) {
              if (!layer.visible) continue;
              const tile = layer.data?.[ty]?.[tx];
              if (tile?.collision && tile.x >= 0 && tile.y >= 0) {
                return true;
              }
            }
          }
        }

        return false;
      }
    };

    const isBlockedByNpcs = (bounds: { x: number; y: number; width: number; height: number }, ignoreId?: string) =>
      npcsRef.current.some((npc) => npc.id !== ignoreId && intersects(bounds, actorBounds(npc)));

    const findNearestWalkablePosition = (
      actor: ActorState,
      preferredX: number,
      preferredY: number,
      ignoreNpcId?: string,
      avoidPlayer = false,
    ) => {
      const isWalkable = (x: number, y: number) => {
        const bounds = actorBounds(actor, x, y);
        if (isBlockedByMap(bounds)) return false;
        if (isBlockedByNpcs(bounds, ignoreNpcId)) return false;
        if (avoidPlayer && intersects(bounds, actorBounds(playerRef.current))) return false;
        return true;
      };

      if (isWalkable(preferredX, preferredY)) {
        return { x: preferredX, y: preferredY };
      }

      const step = 16;
      const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];

      for (let ring = 1; ring <= 8; ring += 1) {
        for (const [dx, dy] of directions) {
          const candidateX = preferredX + dx * ring * step;
          const candidateY = preferredY + dy * ring * step;
          if (isWalkable(candidateX, candidateY)) {
            return { x: candidateX, y: candidateY };
          }
        }
      }

      return null;
    };

    const getIntersectingPortal = () => {
      const currentMap = getCurrentMap();
      const portals = Array.isArray((currentMap as any)?.portalAreas) ? (currentMap as any).portalAreas : [];
      const playerBounds = actorBounds(playerRef.current);

      return (
        portals.find((portal: any) =>
          intersects(playerBounds, {
            x: portal.x,
            y: portal.y,
            width: portal.width,
            height: portal.height,
          }),
        ) || null
      );
    };

    const collectMapImageSources = (currentMap: MapData | null) => {
      const sources: string[] = [];

      if (!currentMap || typeof currentMap !== "object") {
        return sources;
      }

      const isNewFormat = (currentMap as any).objects && Array.isArray((currentMap as any).objects) && (currentMap as any).objects.length > 0;

      if (isNewFormat) {
        const objects = (currentMap as any).objects as Array<{
          spriteData?: { spriteImageSrc?: string; imageSrc?: string; isFullImage?: boolean };
          imageData?: string;
          isBackground?: boolean;
          isGroup?: boolean;
          children?: any[];
        }>;

        const collectImages = (obj: any) => {
          if (obj.isBackground && obj.imageData) {
            sources.push(obj.imageData);
          } else if (obj.spriteData?.isFullImage && obj.spriteData.imageSrc) {
            sources.push(toAssetUrl(obj.spriteData.imageSrc));
          } else if (obj.spriteData?.spriteImageSrc) {
            sources.push(toAssetUrl(obj.spriteData.spriteImageSrc));
          }

          if (obj.isGroup && obj.children) {
            obj.children.forEach((child: any) => collectImages(child));
          }
        };

        objects.forEach((obj) => collectImages(obj));
      } else if (currentMap.layers && Array.isArray(currentMap.layers)) {
        sources.push(
          ...currentMap.layers.map((layer) => layer.tileset).filter(Boolean).map((path) => toAssetUrl(path!)),
        );
      }

      return sources;
    };

    const collectCharacterImageSources = () => {
      const sources = [toAssetUrl(CGS_CHARACTER_SPRITE)];
      const basePath = "/32x32%20Customizable%20Character%20Pack/Walk";
      const directions = ["Front", "Back", "Left", "Right"];
      const layerFiles = [
        { folder: "Character", file: "Character_Walk" },
        { folder: "Clothing", file: "Clothing_Shoes_Walk" },
        { folder: "Clothing", file: "Clothing_Bottoms_Walk" },
        { folder: "Clothing", file: "Clothing_Tops_Walk" },
        { folder: "Hair", file: "Hair_Walk" },
        { folder: "Eyes", file: "Eyes_Walk" },
      ];

      layerFiles.forEach((layer) => {
        directions.forEach((direction) => {
          if (layer.folder === "Eyes" && direction === "Back") return;
          sources.push(toAssetUrl(`${basePath}/${layer.folder}/${layer.file}_${direction}-Sheet.png`));
        });
      });

      return sources;
    };

    const preloadImageSources = async (sources: string[]) => {
      const uniqueSources = [...new Set(sources.filter(Boolean))];
      await Promise.all(uniqueSources.map((src) => loadImage(src)));
    };

    const saveCurrentLocation = (positionX: number, positionY: number) => {
      const token = getStoredAuthToken();
      if (!token) return;

      fetch(`${apiUrl}/api/game/progress`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          positionX,
          positionY,
          ...(currentSharedMapIdRef.current
            ? { currentMap: `shared:${currentSharedMapIdRef.current}` }
            : currentMapKeyRef.current
              ? { currentMap: currentMapKeyRef.current }
              : {}),
        }),
      }).catch(() => {});
    };

    const tryPortalTeleport = async () => {
      const activePortal = getIntersectingPortal();

      if (!activePortal) {
        portalLockRef.current = null;
        setPortalDebugMessage("");
        return;
      }

      const activePortalKey = `${currentSharedMapIdRef.current || "local"}:${activePortal.id || activePortal.portalCode}`;
      if (portalLockRef.current === activePortalKey || teleportingRef.current) {
        setPortalDebugMessage(`门 ${activePortal.portalCode || "?"} 已锁定，离开后可再次触发`);
        return;
      }

      if (!currentSharedMapIdRef.current || activePortal.portalCode === undefined || activePortal.portalCode === null) {
        portalLockRef.current = activePortalKey;
        setPortalDebugMessage(`检测到门 ${activePortal.portalCode || "?"}，但当前地图未绑定共享地图ID`);
        return;
      }

      const token = getStoredAuthToken();
      if (!token) return;

      teleportingRef.current = true;
      setPortalDebugMessage(`检测到门 ${activePortal.portalCode}，正在查询目标...`);

      try {
        const response = await fetch(
          `${apiUrl}/api/game/portal-target?fromMapId=${encodeURIComponent(currentSharedMapIdRef.current)}&portalCode=${encodeURIComponent(String(activePortal.portalCode))}&currentPortalId=${encodeURIComponent(String(activePortal.id || ""))}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const payload = await response.json();
        if (!response.ok || !payload.map) {
          throw new Error(payload.error || "传送失败");
        }

        const nextMap = payload.map as MapData;
        await preloadImageSources([...collectMapImageSources(nextMap), ...collectCharacterImageSources()]);
        mapRef.current = nextMap;
        syncCanvasToMap(nextMap);
        currentSharedMapIdRef.current = payload.mapId ?? null;
        currentMapKeyRef.current =
          payload.mapKey ||
          (payload.mapId ? `shared:${payload.mapId}` : currentMapKeyRef.current);
        npcsRef.current = hydrateNpcRoster(
          payload.npcs,
          (nextMap as any).gridSize || nextMap.tileSize || 48,
          (nextMap as any).cols || nextMap.width || 20,
          (nextMap as any).rows || nextMap.height || 15,
        );

        playerRef.current.x = payload.spawn?.x ?? playerRef.current.x;
        playerRef.current.y = payload.spawn?.y ?? playerRef.current.y;

        const resolvedPlayerSpawn = findNearestWalkablePosition(
          playerRef.current,
          playerRef.current.x,
          playerRef.current.y,
          undefined,
          false,
        );
        if (resolvedPlayerSpawn) {
          playerRef.current.x = resolvedPlayerSpawn.x;
          playerRef.current.y = resolvedPlayerSpawn.y;
        }
        
        // 修复玩家与墙的碰撞
        fixPlayerWallCollision(playerRef.current, nextMap);
        
        // 修复玩家与NPC重叠
        fixPlayerNpcOverlap(playerRef.current, npcsRef.current);
        
        portalLockRef.current = `${payload.mapId || "local"}:${payload.spawn?.portalId || payload.spawn?.portalCode || activePortal.portalCode}`;
        saveCurrentLocation(playerRef.current.x, playerRef.current.y);
        setPortalDebugMessage(`已传送到门 ${payload.spawn?.portalCode || activePortal.portalCode}（地图 ${payload.mapId || "local"}）`);
      } catch (error) {
        console.error("Portal teleport failed:", error);
        setPortalDebugMessage(error instanceof Error ? `传送失败：${error.message}` : "传送失败");
      } finally {
        teleportingRef.current = false;
      }
    };

    const savePosition = () => {
      saveCurrentLocation(playerRef.current.x, playerRef.current.y);
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
      ctx.font = `13px ${CANVAS_FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      
      // 绘制状态（如果有）
      if (statusText) {
        const statusY = y - 16;
        ctx.font = `11px ${CANVAS_FONT_FAMILY}`;
        
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

    const drawActorVisual = (
      actor: ActorState, 
      spriteColumnOffset: number,
      characterRow: number,
      npc?: NpcState,
      playerAppearanceOverride?: CharacterAppearance | null
    ) => {
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
          const directionMap: Record<Direction, number> = {
            Front: 0,
            Left: 1,
            Right: 2,
            Back: 3,
          };
          const row = characterRow + directionMap[actor.direction];
          const srcX = (spriteColumnOffset + actor.currentFrame) * 32;
          const srcY = row * 48;
          ctx.drawImage(sprite, srcX, srcY, 32, 48, actor.x, actor.y, actor.width, actor.height);
        } else {
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(actor.x, actor.y, actor.width, actor.height);
        }
      }
    };

    const drawActorLabel = (
      actor: ActorState,
      label: string,
      npc?: NpcState,
    ) => {
      // 获取NPC状态文本和颜色
      let statusText: string | undefined;
      let statusColor: string | undefined;
      
      if (npc && npc.activityStatus && npc.currentMood) {
        statusText = getStatusDisplayText(npc.activityStatus, npc.currentMood);
        statusColor = getStatusColor(npc.activityStatus);
      }

      drawLabel(label, actor.x + actor.width / 2, actor.y - 6, statusText, statusColor);
    };

    const drawActorSprite = (
      actor: ActorState, 
      spriteColumnOffset: number, 
      characterRow: number, 
      label: string,
      npc?: NpcState,
      playerAppearanceOverride?: CharacterAppearance | null
    ) => {
      drawActorVisual(actor, spriteColumnOffset, characterRow, npc, playerAppearanceOverride);
      drawActorLabel(actor, label, npc);
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
      let hasLayerImage = false;

      layers.forEach(layer => {
        // Eyes没有Back方向，使用Front代替
        const layerDirection = (layer.folder === 'Eyes' && direction === 'Back') ? 'Front' : direction;
        const imgPath = `${basePath}/${layer.folder}/${layer.file}_${layerDirection}-Sheet.png`;
        const img = imageCache.get(toAssetUrl(imgPath));
        
        if (img) {
          hasLayerImage = true;
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

      if (!hasLayerImage) {
        const sprite = imageCache.get(toAssetUrl(CGS_CHARACTER_SPRITE));
        if (sprite) {
          const directionRowMap: Record<Direction, number> = {
            Front: 0,
            Left: 1,
            Right: 2,
            Back: 3,
          };
          const srcX = actor.currentFrame * 32;
          const srcY = (PLAYER_CHARACTER_ROW + directionRowMap[actor.direction]) * 48;
          ctx.drawImage(sprite, srcX, srcY, 32, 48, actor.x, actor.y, actor.width, actor.height);
        }
      }
    };

    const updatePlayer = () => {
      let inputX = 0;
      let inputY = 0;

      if (keysRef.current.ArrowUp || keysRef.current.w) inputY -= 1;
      if (keysRef.current.ArrowDown || keysRef.current.s) inputY += 1;
      if (keysRef.current.ArrowLeft || keysRef.current.a) inputX -= 1;
      if (keysRef.current.ArrowRight || keysRef.current.d) inputX += 1;

      inputX += joystickVectorRef.current.x;
      inputY += joystickVectorRef.current.y;

      const magnitude = Math.hypot(inputX, inputY);
      let dx = 0;
      let dy = 0;

      if (magnitude > 0) {
        const normalizedX = magnitude > 1 ? inputX / magnitude : inputX;
        const normalizedY = magnitude > 1 ? inputY / magnitude : inputY;
        dx = normalizedX * playerRef.current.speed;
        dy = normalizedY * playerRef.current.speed;
      }

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx < 0) playerRef.current.direction = "Left";
        else if (dx > 0) playerRef.current.direction = "Right";
      } else {
        if (dy < 0) playerRef.current.direction = "Back";
        else if (dy > 0) playerRef.current.direction = "Front";
      }

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
            
            // 检测 NPC 是否进入传送门区域
            checkNpcPortalTeleport(npc);
          } else {
            const unstuckPosition = findNearestWalkablePosition(npc, npc.x, npc.y, npc.id, true);
            if (unstuckPosition) {
              npc.x = unstuckPosition.x;
              npc.y = unstuckPosition.y;
              npc.anchorX = unstuckPosition.x;
              npc.anchorY = unstuckPosition.y;
            }
            npc.isMoving = false;
          }
        }

        updateAnimationFrame(npc);
      }
    };

    const drawMap = () => {
      const currentMap = getCurrentMap();
      const { tileSize, mapCols, mapRows } = syncCanvasToMap(currentMap);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 检查地图是否存在
      if (!currentMap || typeof currentMap !== "object") {
        // 没有地图，绘制空白背景
        ctx.fillStyle = '#2d5016'; // 草地绿色
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // 检查是否是新格式的地图（使用objects而不是layers的瓦片数据）
      const isNewFormat = (currentMap as any).objects && Array.isArray((currentMap as any).objects) && (currentMap as any).objects.length > 0;
      
      if (isNewFormat) {
        // 新格式：渲染对象
        const objects = (currentMap as any).objects as Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          layer: number;
          rotation?: number;
          spriteData?: {
            spriteImageSrc?: string;
            sx: number;
            sy: number;
            sWidth: number;
            sHeight: number;
          };
          imageData?: string;
          isBackground?: boolean;
          isGroup?: boolean;
          children?: any[];
        }>;
        
        // 递归绘制对象（支持组合对象）
        const drawObject = (obj: any, offsetX = 0, offsetY = 0) => {
          if (obj.isGroup && obj.children) {
            // 绘制组合对象的子对象
            obj.children.forEach((child: any) => {
              drawObject(child, obj.x + (child.relativeX || 0), obj.y + (child.relativeY || 0));
            });
          } else {
            const x = offsetX || obj.x;
            const y = offsetY || obj.y;
            
            ctx.save();
            ctx.translate(x + obj.width / 2, y + obj.height / 2);
            if (obj.rotation) {
              ctx.rotate((obj.rotation * Math.PI) / 180);
            }
            
            if (obj.isBackground && obj.imageData) {
              // 背景图
              const img = ensureImage(obj.imageData);
              if (img) {
                ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
              }
            } else if (obj.spriteData?.isFullImage && obj.spriteData.imageSrc) {
              const img = ensureImage(obj.spriteData.imageSrc);
              if (img) {
                ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
              }
            } else if (obj.spriteData && obj.spriteData.spriteImageSrc) {
              // 瓦片集素材
              const img = ensureImage(obj.spriteData.spriteImageSrc);
              if (img) {
                const sourceX = obj.spriteData.sx ?? obj.spriteData.x ?? 0;
                const sourceY = obj.spriteData.sy ?? obj.spriteData.y ?? 0;
                const sourceWidth = obj.spriteData.sWidth ?? obj.spriteData.width ?? obj.width;
                const sourceHeight = obj.spriteData.sHeight ?? obj.spriteData.height ?? obj.height;
                ctx.drawImage(
                  img,
                  sourceX,
                  sourceY,
                  sourceWidth,
                  sourceHeight,
                  -obj.width / 2,
                  -obj.height / 2,
                  obj.width,
                  obj.height
                );
              }
            }
            
            ctx.restore();
          }
        };

        const objectSortY = (obj: any) => {
          if (obj.isBackground || obj.layer === 0) {
            return -1000 + (obj.y || 0);
          }

          if (obj.isGroup) {
            return obj.collision
              ? obj.collision.y + (obj.collision.height || 0)
              : obj.y + obj.height;
          }

          return obj.collision
            ? obj.collision.y + (obj.collision.height || 0)
            : obj.y + obj.height;
        };

        const actorSortY = (actor: ActorState) =>
          actor.y + actor.collisionOffsetY + actor.collisionHeight;

        const sortedObjects = [...objects].sort((a, b) => {
          if ((a.layer ?? 0) !== (b.layer ?? 0)) {
            return (a.layer ?? 0) - (b.layer ?? 0);
          }
          return ((a.y || 0) + (a.height || 0)) - ((b.y || 0) + (b.height || 0));
        });

        const renderables: Array<
          | { type: "object"; sortY: number; layer: number; order: number; obj: any }
          | {
              type: "actor";
              sortY: number;
              layer: number;
              order: number;
              actor: ActorState;
              spriteColumnOffset: number;
              characterRow: number;
              label: string;
              npc?: NpcState;
              appearance?: CharacterAppearance | null;
            }
        > = [];

        sortedObjects.forEach((obj, index) => {
          renderables.push({
            type: "object",
            obj,
            layer: obj.layer ?? 0,
            order: index,
            sortY: objectSortY(obj),
          });
        });

        npcsRef.current.forEach((npc, index) => {
          renderables.push({
            type: "actor",
            actor: npc,
            label: npc.name,
            npc,
            appearance: npc.appearance,
            spriteColumnOffset: npc.spriteColumnOffset,
            characterRow: npc.characterRow,
            layer: 1,
            order: objects.length + index,
            sortY: actorSortY(npc),
          });
        });

        renderables.push({
          type: "actor",
          actor: playerRef.current,
          label: username || "玩家",
          appearance: playerAppearance,
          spriteColumnOffset: PLAYER_SPRITE_COLUMN_OFFSET,
          characterRow: PLAYER_CHARACTER_ROW,
          layer: Number.MAX_SAFE_INTEGER,
          order: Number.MAX_SAFE_INTEGER,
          sortY: actorSortY(playerRef.current),
        });

        renderables.sort((a, b) => a.sortY - b.sortY);

        renderables.sort((a, b) => {
          const aIsFlatObject =
            a.type === "object" &&
            !a.obj?.isBackground &&
            (a.obj?.layer ?? 0) !== 0 &&
            !a.obj?.collision;
          const bIsFlatObject =
            b.type === "object" &&
            !b.obj?.isBackground &&
            (b.obj?.layer ?? 0) !== 0 &&
            !b.obj?.collision;

          if (a.type === "actor" && bIsFlatObject) {
            return 1;
          }
          if (aIsFlatObject && b.type === "actor") {
            return -1;
          }
          if (a.type === "object" && b.type === "object" && a.layer !== b.layer) {
            return a.layer - b.layer;
          }
          return (a.sortY - b.sortY) || (a.order - b.order);
        });

        renderables.forEach((item) => {
          if (item.type === "object") {
            drawObject(item.obj);
            return;
          }

          drawActorVisual(
            item.actor,
            item.spriteColumnOffset,
            item.characterRow,
            item.npc,
            item.appearance,
          );
        });

        renderables.forEach((item) => {
          if (item.type === "actor") {
            drawActorLabel(item.actor, item.label, item.npc);
          }
        });
      } else if (currentMap.layers && Array.isArray(currentMap.layers)) {
        // 旧格式：渲染瓦片
        for (const layer of currentMap.layers) {
          if (!layer.visible || !layer.tileset) continue;

          const img = imageCache.get(toAssetUrl(layer.tileset));
          if (!img) continue;

          const layerTileSize = layer.tileSize || tileSize;
          for (let y = 0; y < mapRows; y += 1) {
            for (let x = 0; x < mapCols; x += 1) {
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
      }
    };

    const tick = () => {
      updatePlayer();
      updateNpcs();
      drawMap();
      void tryPortalTeleport();

      if (!((getCurrentMap() as any)?.objects && Array.isArray((getCurrentMap() as any)?.objects) && (getCurrentMap() as any).objects.length > 0)) {
        for (const npc of npcsRef.current) {
          drawActorSprite(npc, npc.spriteColumnOffset, npc.characterRow, npc.name, npc);
        }

        drawActorSprite(playerRef.current, PLAYER_SPRITE_COLUMN_OFFSET, PLAYER_CHARACTER_ROW, username || "玩家", undefined, playerAppearance);
      }
      interactionFrame += 1;
      if (interactionFrame % 15 === 0) {
        setPresenceTick((value) => value + 1);
      }
      animationRef.current = window.requestAnimationFrame(tick);
    };

    const prepare = async () => {
      if ("fonts" in document) {
        await Promise.allSettled([
          document.fonts.load('13px "HanYi Pixel UI"'),
          document.fonts.load('11px "HanYi Pixel UI"'),
        ]);
      }

      try {
        await preloadImageSources([...collectMapImageSources(getCurrentMap()), ...collectCharacterImageSources()]);
        setStatus("游戏已加载，使用方向键或 WASD 移动角色。靠近 NPC 后按 C，或直接点击 NPC 对话。");
      } catch (error) {
        console.error('图片加载失败:', error);
        setStatus("游戏已加载（部分图片加载失败），使用方向键或 WASD 移动角色。");
      }
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
    const token = getStoredAuthToken();
    const message = chatInput.trim();
    if (!token || !selectedNpc || !message || chatLoading) return;

    setChatLoading(true);
    setChatInput("");
    setChatMessages((prev) => ({
      ...prev,
      [selectedNpc.id]: [...(prev[selectedNpc.id] || []), { role: "user", text: message, senderId: userId }],
    }));

    try {
      const response = await fetchGameApi(`/api/game/npc-chat`, {
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

      const { data, rawText } = await parseApiResponse<{
        error?: string;
        reply?: string;
        source?: string;
        relationship?: ChatMessage["relationship"];
        aiEvaluation?: ChatMessage["aiEvaluation"];
        secondMeDebug?: {
          sessionId?: string | null;
          sessionSource?: string | null;
          authMode?: string | null;
          fallbackReason?: string | null;
        };
      }>(response);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            rawText ||
            (response.status === 504 ? "NPC 暂时没有回上来，可能是上游接口超时了。" : `NPC 回复失败（${response.status}）`),
        );
      }
      if (data?.secondMeDebug?.sessionId) {
        console.log(
          `🟣 会话调试: sessionId=${data.secondMeDebug.sessionId} source=${data.secondMeDebug.sessionSource || "unknown"} auth=${data.secondMeDebug.authMode || "unknown"} npc=${selectedNpc.id}`,
        );
      }
      if (data?.secondMeDebug?.fallbackReason) {
        console.warn(`🟠 SecondMe fallback reason: ${data.secondMeDebug.fallbackReason}`);
      }
      if (data?.source === "local-fallback") {
        console.warn("⚠️ 当前回复来自本地兜底模板，不是 SecondMe 实时回复");
      }

      // 添加NPC回复，包含关系信息
      const npcMessage: ChatMessage = {
        role: "npc",
        text: data?.reply || "...",
        senderId: selectedNpc.id, // NPC is the sender
        relationship: data?.relationship,
        aiEvaluation: data?.aiEvaluation,
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
          { role: "npc", text: error instanceof Error ? error.message : "NPC 暂时没有回应。", senderId: selectedNpc.id },
        ],
      }));
    } finally {
      setChatLoading(false);
    }
  };

  const updateJoystickFromPoint = (clientX: number, clientY: number, rect: DOMRect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.34;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const limitedDistance = Math.min(distance, maxRadius);
    const angle = distance ? Math.atan2(rawY, rawX) : 0;
    const knobX = Math.cos(angle) * limitedDistance;
    const knobY = Math.sin(angle) * limitedDistance;

    joystickVectorRef.current = {
      x: maxRadius ? knobX / maxRadius : 0,
      y: maxRadius ? knobY / maxRadius : 0,
    };
    setJoystick({ active: true, x: knobX, y: knobY });
  };

  const releaseJoystick = () => {
    joystickPointerIdRef.current = null;
    joystickVectorRef.current = { x: 0, y: 0 };
    setJoystick({ active: false, x: 0, y: 0 });
  };

  const handleJoystickPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    joystickPointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystickFromPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
  };

  const handleJoystickPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerIdRef.current !== event.pointerId) return;
    updateJoystickFromPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
  };

  const handleJoystickPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerIdRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    releaseJoystick();
  };

  const handleMobileInteract = () => {
    if (!closestNpc) return;
    void requestLandscapeMode();
    if ("vibrate" in navigator) {
      navigator.vibrate(12);
    }
    setSelectedNpcId(closestNpc.id);
  };

  void presenceTick;

  const nearbyNpcs = npcsRef.current
    .filter((npc) => Math.hypot(npc.x - playerRef.current.x, npc.y - playerRef.current.y) < 180)
    .sort((a, b) => Math.hypot(a.x - playerRef.current.x, a.y - playerRef.current.y) - Math.hypot(b.x - playerRef.current.x, b.y - playerRef.current.y));
  const closestNpc = nearbyNpcs[0] || null;
  const activeChatMessages = selectedNpc ? (chatMessages[selectedNpc.id] || []) : [];
  const latestRelationship = [...activeChatMessages]
    .reverse()
    .find((message) => message.role === "npc" && message.relationship)?.relationship;
  const affinityValue = latestRelationship?.affinity ?? 0;
  const familiarityValue = latestRelationship?.familiarity ?? 0;

  return (
    <main className="font-game-body fixed inset-0 overflow-hidden bg-[#09111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,_rgba(6,10,18,0.08),_rgba(3,8,20,0.52))]" />

      {hasMap ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} className="block max-h-full max-w-full bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)]" />
        </div>
      ) : (
        <div className="font-game-display relative z-10 flex h-full items-center justify-center px-8 text-center text-lg leading-8 tracking-[0.08em] text-[#fff2c7]">
          {status}
        </div>
      )}

      {hasMap && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 flex w-[calc(100%-2rem)] items-start justify-between gap-3">
          <div className="pointer-events-auto flex items-center gap-2">
            <AssetCounter variant="coin" label="金币" value={gold} />
            <AssetCounter variant="energy" label="状态" value={selectedNpc ? "交谈中" : "探索中"} className="hidden sm:inline-flex" />
          </div>
          <div className="pointer-events-auto">
            <AssetIconButton
              variant="menu"
              label="打开菜单"
              onClick={() => setImmersiveMode(false)}
            />
          </div>
        </div>
      )}

      {hasMap && portalDebugMessage && (
        <div className="pointer-events-none absolute left-4 top-20 z-20 max-w-[min(520px,calc(100%-2rem))] rounded-[14px] border-2 border-[#6de9ff]/40 bg-[rgba(13,22,42,0.88)] px-4 py-3 text-[#e9f8ff] shadow-[0_12px_24px_rgba(0,0,0,0.28)]">
          <div className="font-game-display text-[12px] text-[#fff2b8]">传送门调试</div>
          <div className="font-game-ui mt-1 text-[11px] leading-5 text-[#c8d5f0]">{portalDebugMessage}</div>
        </div>
      )}

      {immersiveMode && hasMap && (
        <>
          {closestNpc && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 md:block">
              <RpgPromptPanel className="w-[620px] drop-shadow-[0_16px_42px_rgba(0,0,0,0.34)]">
                <div className="font-game-ui flex w-full translate-x-5 -translate-y-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] leading-7 text-[#4a2a58] md:flex-nowrap">
                  <span>靠近 {closestNpc.name} 后按</span>
                  <RpgKeyBadge>C</RpgKeyBadge>
                  <span>对话，或直接点击 TA</span>
                </div>
              </RpgPromptPanel>
            </div>
          )}

          {isTouchControlsEnabled && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="pointer-events-auto flex flex-col gap-2">
                {closestNpc ? (
                  <div className="w-[160px] rounded-[18px] border-2 border-[#4af2ff]/45 bg-[rgba(11,18,35,0.78)] px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    <div className="font-game-display text-[12px] text-[#fff2b8]">附近有人</div>
                    <div className="font-game-ui mt-1 text-[11px] leading-5 text-[#d9f4ff]">
                      靠近 {closestNpc.name} 后点右侧按钮对话
                    </div>
                  </div>
                ) : (
                  <div className="w-[160px] rounded-[18px] border-2 border-white/10 bg-[rgba(11,18,35,0.72)] px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    <div className="font-game-display text-[12px] text-[#fff2b8]">移动模式</div>
                    <div className="font-game-ui mt-1 text-[11px] leading-5 text-[#c8d5f0]">
                      左手拖动摇杆探索地图
                    </div>
                  </div>
                )}

                <div
                  className="relative h-[132px] w-[132px] touch-none rounded-full border-4 border-[#3e567e] bg-[radial-gradient(circle_at_50%_38%,_rgba(105,237,255,0.18),_rgba(13,23,43,0.92)_72%)] shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                  onPointerDown={handleJoystickPointerDown}
                  onPointerMove={handleJoystickPointerMove}
                  onPointerUp={handleJoystickPointerEnd}
                  onPointerCancel={handleJoystickPointerEnd}
                >
                  <div className="absolute inset-[18px] rounded-full border border-dashed border-white/10" />
                  <div className="absolute left-1/2 top-1/2 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8ef7ff]/35 bg-[rgba(255,255,255,0.04)]" />
                  <div
                    className={`absolute left-1/2 top-1/2 flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#fff0be] bg-[radial-gradient(circle_at_35%_30%,_#fff8dc,_#ffd265_58%,_#f58f23)] shadow-[0_10px_18px_rgba(0,0,0,0.32)] transition-transform ${
                      joystick.active ? "scale-95" : ""
                    }`}
                    style={{ transform: `translate(calc(-50% + ${joystick.x}px), calc(-50% + ${joystick.y}px))` }}
                  >
                    <div className="h-4 w-4 rounded-full bg-[rgba(83,42,12,0.82)]" />
                  </div>
                </div>
              </div>

              <div className="pointer-events-auto flex flex-col items-end gap-3">
                <button
                  type="button"
                  onClick={handleMobileInteract}
                  disabled={!closestNpc}
                  className={`min-h-[72px] min-w-[72px] rounded-[22px] border-4 px-4 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.32)] transition active:scale-95 ${
                    closestNpc
                      ? "border-[#ffe8a6] bg-[linear-gradient(180deg,_#fff0bd,_#ffb547)] text-[#4a2a10]"
                      : "border-white/10 bg-[rgba(25,34,57,0.78)] text-[#7f90b6]"
                  }`}
                >
                  <div className="font-game-display text-[16px]">对话</div>
                  <div className="font-game-ui mt-1 text-[10px] tracking-[0.08em]">
                    {closestNpc ? closestNpc.name : "暂无目标"}
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!immersiveMode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(6,8,18,0.62)] px-6 backdrop-blur-[3px]">
          <div className="flex max-w-[760px] flex-col items-center gap-5">
            <div className="font-game-display-tight text-center text-[28px] text-[#fff4d4] drop-shadow-[0_4px_0_rgba(39,20,63,0.92)]">
              菜单界面
            </div>
            <p className="font-game-ui max-w-[560px] text-center text-[13px] leading-7 text-[#f3dfbf]">
              暂停后可以继续探索小镇，也可以回到角色工坊或编辑器调整内容。
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <RpgButton onClick={() => setImmersiveMode(true)} dark>
                返回地图
              </RpgButton>
              <RpgLinkButton href="/character-creator">
                角色工坊
              </RpgLinkButton>
              <RpgLinkButton href="/editor">编辑地图</RpgLinkButton>
              <RpgLinkButton href="/">返回首页</RpgLinkButton>
            </div>
          </div>
        </div>
      )}

      {hasMap && isTouchControlsEnabled && isPortraitMobile && (
        <div className="absolute inset-0 z-[35] flex items-center justify-center bg-[rgba(4,9,20,0.88)] px-5 py-6 backdrop-blur-[3px]">
          <div className="pixel-frame max-w-[360px] overflow-hidden">
            <div className="bg-[linear-gradient(180deg,_rgba(19,13,37,0.98),_rgba(10,9,24,0.98))] p-5 text-center">
              <div className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#74ecff]">
                Landscape Mode
              </div>
              <div className="mt-4 font-game-display-tight text-[28px] leading-tight text-[#fff3c8]">
                请横屏游玩
              </div>
              <p className="mt-4 font-game-ui text-[13px] leading-7 text-[#d7def6]">
                手机端会优先尝试自动切到横屏。横屏后地图视野、摇杆和对话按钮都会更自然。
              </p>

              <div className="mt-5 flex items-center justify-center gap-4">
                <div className="h-16 w-10 rounded-[10px] border-4 border-[#7ae9ff] bg-[rgba(31,47,87,0.92)] shadow-[0_10px_18px_rgba(0,0,0,0.28)]" />
                <div className="font-pixel text-[18px] text-[#ffd46d]">→</div>
                <div className="h-10 w-16 rounded-[10px] border-4 border-[#ffe3a6] bg-[rgba(64,34,94,0.94)] shadow-[0_10px_18px_rgba(0,0,0,0.28)]" />
              </div>

              <button
                type="button"
                onClick={() => {
                  void requestLandscapeMode();
                }}
                className="mt-6 inline-flex min-h-[58px] min-w-[220px] items-center justify-center border-4 border-[#fff0be] bg-[linear-gradient(180deg,_#fff0bd,_#ffb547)] px-5 py-3 font-game-display text-[18px] text-[#4a2a10] shadow-[0_14px_28px_rgba(0,0,0,0.3)] active:scale-95"
              >
                进入横屏模式
              </button>

              <div className="mt-4 font-game-ui text-[11px] leading-6 text-[#b8c6eb]">
                {orientationHint || "如果没有自动切换，请先关闭系统方向锁定，再旋转设备。"}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNpc && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(5,10,20,0.35)] px-3 py-4">
          <div className="font-game-body relative flex h-[85vh] max-h-[720px] w-full max-w-[340px] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#f5f8ff] text-slate-900 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setSelectedNpcId(null)}
              className="absolute right-1 top-1 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40"
              aria-label="关闭"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-[linear-gradient(135deg,_#12d6df,_#77f2c8)] px-3 py-2 text-slate-950">
              <div className="flex items-center justify-center gap-3">
                <div className="flex-shrink-0">
                  {selectedNpc.avatar ? (
                    <img
                      src={toAvatarUrl(selectedNpc.avatar)}
                      alt={selectedNpc.name}
                      className="h-9 w-9 rounded-full object-cover shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="font-game-display flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-xs text-white shadow-md"
                    style={{ display: selectedNpc.avatar ? "none" : "flex" }}
                  >
                    {selectedNpc.name?.[0]?.toUpperCase() || "N"}
                  </div>
                </div>

                <div className="min-w-0 max-w-[180px] flex-1">
                  {chatLoading ? (
                    <div className="py-1 text-center">
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/30 px-2 py-1">
                        <div className="flex gap-0.5">
                          <span className="h-1 w-1 animate-bounce rounded-full bg-slate-800" style={{ animationDelay: "0ms" }} />
                          <span className="h-1 w-1 animate-bounce rounded-full bg-slate-800" style={{ animationDelay: "150ms" }} />
                          <span className="h-1 w-1 animate-bounce rounded-full bg-slate-800" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="font-game-readable text-[9px] font-medium text-slate-700">输入中...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1">
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className="font-game-readable text-[9px] font-medium text-slate-800">好感度</span>
                          <span className="font-game-readable text-[9px] font-semibold text-slate-800">{affinityValue}</span>
                        </div>
                        <div className="relative h-1 overflow-hidden rounded-full bg-white/30">
                          <div className="absolute left-1/2 top-0 bottom-0 z-10 w-px bg-slate-600/30" />
                          <div
                            className="absolute h-full transition-all duration-500"
                            style={
                              affinityValue >= 0
                                ? {
                                    left: "50%",
                                    width: `${(affinityValue / 100) * 50}%`,
                                    background: "linear-gradient(to right, #fbbf24, #22c55e)",
                                  }
                                : {
                                    right: "50%",
                                    width: `${(Math.abs(affinityValue) / 100) * 50}%`,
                                    background: "linear-gradient(to left, #fbbf24, #f87171)",
                                  }
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-0.5 flex items-center justify-between">
                          <span className="font-game-readable text-[9px] font-medium text-slate-800">熟悉度</span>
                          <span className="font-game-readable text-[9px] font-semibold text-slate-800">{familiarityValue}</span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/30">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500"
                            style={{ width: `${familiarityValue}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {userAvatar ? (
                    <img
                      src={toAvatarUrl(userAvatar)}
                      alt={username}
                      className="h-9 w-9 rounded-full object-cover shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="font-game-display flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs text-white shadow-md"
                    style={{ display: userAvatar ? "none" : "flex" }}
                  >
                    {username?.[0]?.toUpperCase() || "P"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-[linear-gradient(180deg,_#eaf2ff,_#f8fbff)] p-3">
              <div ref={chatScrollRef} className="h-full overflow-auto rounded-[20px] border border-slate-200/80 bg-white/72 px-2.5 py-3 shadow-inner">
                {activeChatMessages.length ? (
                  <div className="space-y-3">
                    {activeChatMessages.map((item, index) => (
                      <div key={`${selectedNpc.id}-${index}`}>
                        <div className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`font-game-ui max-w-[82%] rounded-[18px] px-3 py-2 text-[13px] leading-5 shadow-sm ${
                              item.role === "user"
                                ? "bg-[#9eea6a] text-slate-900"
                                : "border border-slate-200 bg-white text-slate-800"
                            }`}
                          >
                            {item.text}
                          </div>
                        </div>
                        {item.role === "npc" && item.relationship ? (
                          <div className="mt-1 flex justify-start">
                            <div className="max-w-[82%] space-y-1 px-2">
                              {item.aiEvaluation ? (
                                <div className="font-game-readable rounded-lg bg-slate-50 p-1.5 text-[10px] leading-5">
                                  {item.aiEvaluation.emotionalResponse ? (
                                    <div className="mb-1 text-slate-600">💭 {item.aiEvaluation.emotionalResponse}</div>
                                  ) : null}
                                  {item.aiEvaluation.reasoning ? (
                                    <div className="text-slate-500">📝 {item.aiEvaluation.reasoning}</div>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="font-game-readable text-[9px] leading-5 text-slate-500">
                                {item.relationship.relationshipType ? (
                                  <span className="mr-2">关系: {getRelationshipText(item.relationship.relationshipType as never)}</span>
                                ) : null}
                                {item.relationship.affinity !== undefined ? (
                                  <span className="mr-2" style={{ color: getAffinityColor(item.relationship.affinity) }}>
                                    好感: {item.relationship.affinity} ({getAffinityText(item.relationship.affinity)})
                                    {item.relationship.affinityChange !== undefined && item.relationship.affinityChange !== 0 ? (
                                      <span className={item.relationship.affinityChange > 0 ? "text-green-500" : "text-red-500"}>
                                        {" "}({item.relationship.affinityChange > 0 ? "+" : ""}{item.relationship.affinityChange})
                                      </span>
                                    ) : null}
                                  </span>
                                ) : null}
                                {item.relationship.familiarity !== undefined ? (
                                  <span>
                                    熟悉度: {item.relationship.familiarity} ({getFamiliarityText(item.relationship.familiarity)})
                                    {item.relationship.familiarityChange !== undefined && item.relationship.familiarityChange !== 0 ? (
                                      <span className="text-blue-500"> (+{item.relationship.familiarityChange})</span>
                                    ) : null}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="font-game-readable flex h-full items-center justify-center px-6 text-center text-[15px] leading-7 text-slate-600">
                    和 {selectedNpc.name} 打个招呼吧
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-slate-200 bg-white px-3 pb-3 pt-2">
              <div className="font-game-readable mb-1.5 text-[10px] text-slate-500">按 Enter 发送，按 Esc 关闭聊天</div>
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
                  className="font-game-ui min-h-[44px] flex-1 resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400"
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
