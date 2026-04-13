"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AssetButton,
  AssetLinkButton,
  AssetWindow,
} from "@/components/game/mobile-casual-ui";
import { RpgChip } from "@/components/game/rpg-ui";

const apiUrl = "";
const tokenKey = "sales-simulator-token";

type CharacterAppearance = {
  character: number;
  tops: number;
  bottoms: number;
  shoes: number;
  hair: number;
  eyes: number;
};

export default function CharacterCreatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentLayers, setCurrentLayers] = useState<CharacterAppearance>({
    character: 0,
    tops: 0,
    bottoms: 0,
    shoes: 0,
    hair: 0,
    eyes: 0,
  });

  const staticCanvasRefs = {
    front: useRef<HTMLCanvasElement>(null),
    back: useRef<HTMLCanvasElement>(null),
    left: useRef<HTMLCanvasElement>(null),
    right: useRef<HTMLCanvasElement>(null),
  };
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const characterPosRef = useRef({ x: 296, y: 216 });
  const currentDirectionRef = useRef<"Front" | "Back" | "Left" | "Right">("Front");
  const currentFrameRef = useRef(0);
  const isMovingRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  const basePath = "/32x32%20Customizable%20Character%20Pack/Walk";
  const layerVariants = {
    character: 5,
    tops: 29,
    bottoms: 14,
    shoes: 10,
    hair: 25,
    eyes: 4,
  };

  const layerFiles = {
    character: "Character_Walk",
    tops: "Clothing_Tops_Walk",
    bottoms: "Clothing_Bottoms_Walk",
    shoes: "Clothing_Shoes_Walk",
    hair: "Hair_Walk",
    eyes: "Eyes_Walk",
  };

  const getLayerFolder = (layer: keyof CharacterAppearance) => {
    const folders = {
      character: "Character",
      tops: "Clothing",
      bottoms: "Clothing",
      shoes: "Clothing",
      hair: "Hair",
      eyes: "Eyes",
    };
    return folders[layer];
  };

  // 加载已保存的外观
  useEffect(() => {
    const loadSavedAppearance = async () => {
      const token = localStorage.getItem(tokenKey);
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/game/character-appearance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.appearance) {
            setCurrentLayers(data.appearance);
          }
        }
      } catch (error) {
        console.error("加载外观失败:", error);
      }
    };

    void loadSavedAppearance();
  }, [router]);

  // 更新静态预览
  useEffect(() => {
    const updateStaticPreviews = async () => {
      const directions: Array<{ key: keyof typeof staticCanvasRefs; dir: "Front" | "Back" | "Left" | "Right" }> = [
        { key: "front", dir: "Front" },
        { key: "back", dir: "Back" },
        { key: "left", dir: "Left" },
        { key: "right", dir: "Right" },
      ];

      for (const { key, dir } of directions) {
        const canvas = staticCanvasRefs[key].current;
        if (!canvas) continue;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const layers: Array<keyof CharacterAppearance> = ["character", "shoes", "bottoms", "tops", "hair", "eyes"];

        for (const layer of layers) {
          // 眼睛在背面方向不显示
          if (layer === "eyes" && dir === "Back") continue;

          const fileName = layerFiles[layer];
          const folder = getLayerFolder(layer);
          const imgPath = `${basePath}/${folder}/${fileName}_${dir}-Sheet.png`;
          const variantIndex = currentLayers[layer];

          await drawStaticLayer(ctx, imgPath, variantIndex);
        }
      }
    };

    void updateStaticPreviews();
  }, [currentLayers]);

  const drawStaticLayer = (ctx: CanvasRenderingContext2D, imgPath: string, variantIndex: number) => {
    return new Promise<void>((resolve) => {
      if (imageCacheRef.current[imgPath]) {
        const img = imageCacheRef.current[imgPath];
        ctx.drawImage(img, 0, variantIndex * 32, 32, 32, 8, 8, 48, 48);
        resolve();
      } else {
        const img = new Image();
        img.onload = () => {
          imageCacheRef.current[imgPath] = img;
          ctx.drawImage(img, 0, variantIndex * 32, 32, 32, 8, 8, 48, 48);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imgPath;
      }
    });
  };

  // 动画循环
  useEffect(() => {
    let frameCounter = 0;
    let animationId: number;

    const animate = () => {
      frameCounter++;

      if (isMovingRef.current && frameCounter % 6 === 0) {
        currentFrameRef.current = (currentFrameRef.current + 1) % 4;
      }

      updatePreview();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [currentLayers]);

  const updatePreview = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景网格
    ctx.fillStyle = "#d4e8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#b8d4f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const layers: Array<keyof CharacterAppearance> = ["character", "shoes", "bottoms", "tops", "hair", "eyes"];

    for (const layer of layers) {
      // 眼睛在背面方向不显示
      if (layer === "eyes" && currentDirectionRef.current === "Back") continue;

      const fileName = layerFiles[layer];
      const folder = getLayerFolder(layer);
      const imgPath = `${basePath}/${folder}/${fileName}_${currentDirectionRef.current}-Sheet.png`;
      const variantIndex = currentLayers[layer];

      await drawLayerFrame(ctx, imgPath, variantIndex);
    }
  };

  const drawLayerFrame = (ctx: CanvasRenderingContext2D, imgPath: string, variantIndex: number) => {
    return new Promise<void>((resolve) => {
      if (imageCacheRef.current[imgPath]) {
        const img = imageCacheRef.current[imgPath];
        ctx.drawImage(
          img,
          currentFrameRef.current * 32,
          variantIndex * 32,
          32,
          32,
          characterPosRef.current.x,
          characterPosRef.current.y,
          48,
          48
        );
        resolve();
      } else {
        const img = new Image();
        img.onload = () => {
          imageCacheRef.current[imgPath] = img;
          ctx.drawImage(
            img,
            currentFrameRef.current * 32,
            variantIndex * 32,
            32,
            32,
            characterPosRef.current.x,
            characterPosRef.current.y,
            48,
            48
          );
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imgPath;
      }
    });
  };

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!["w", "a", "s", "d"].includes(key)) return;

      e.preventDefault();
      keysRef.current[key] = true;

      if (keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d) {
        isMovingRef.current = true;

        if (keysRef.current.w) currentDirectionRef.current = "Back";
        else if (keysRef.current.s) currentDirectionRef.current = "Front";
        else if (keysRef.current.a) currentDirectionRef.current = "Left";
        else if (keysRef.current.d) currentDirectionRef.current = "Right";
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;

      if (!keysRef.current.w && !keysRef.current.a && !keysRef.current.s && !keysRef.current.d) {
        isMovingRef.current = false;
        currentFrameRef.current = 0;
      }
    };

    const updateMovement = () => {
      if (isMovingRef.current) {
        const speed = 3;

        if (keysRef.current.w && characterPosRef.current.y > 0) {
          characterPosRef.current.y -= speed;
          currentDirectionRef.current = "Back";
        }
        if (keysRef.current.s && characterPosRef.current.y < 432) {
          characterPosRef.current.y += speed;
          currentDirectionRef.current = "Front";
        }
        if (keysRef.current.a && characterPosRef.current.x > 0) {
          characterPosRef.current.x -= speed;
          currentDirectionRef.current = "Left";
        }
        if (keysRef.current.d && characterPosRef.current.x < 592) {
          characterPosRef.current.x += speed;
          currentDirectionRef.current = "Right";
        }
      }

      requestAnimationFrame(updateMovement);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    updateMovement();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const selectLayer = (layer: keyof CharacterAppearance, index: number) => {
    setCurrentLayers((prev) => ({ ...prev, [layer]: index }));
  };

  const randomizeAppearance = () => {
    setCurrentLayers({
      character: Math.floor(Math.random() * layerVariants.character),
      tops: Math.floor(Math.random() * layerVariants.tops),
      bottoms: Math.floor(Math.random() * layerVariants.bottoms),
      shoes: Math.floor(Math.random() * layerVariants.shoes),
      hair: Math.floor(Math.random() * layerVariants.hair),
      eyes: Math.floor(Math.random() * layerVariants.eyes),
    });
  };

  const resetToDefault = () => {
    setCurrentLayers({
      character: 0,
      tops: 0,
      bottoms: 0,
      shoes: 0,
      hair: 0,
      eyes: 0,
    });
  };

  const saveAndContinue = async () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      alert("请先登录！");
      router.replace("/auth/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/game/character-appearance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appearance: currentLayers }),
      });

      if (response.ok) {
        alert("角色外观已保存！");
        router.push("/game");
      } else {
        alert("保存失败，请重试");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#26184b] via-[#1b1436] to-[#43245b] flex items-center justify-center p-2.5">
      <div className="max-w-[1440px] w-full bg-gradient-to-b from-[#f8f1df] to-[#f0e6ce] border-4 border-[#2c213d] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#5d3a8f] via-[#3f2b6b] to-[#2c213d] px-5 py-2.5 border-b-4 border-[#2c213d] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#fff9df] drop-shadow-md">创建你的角色</h1>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-[#f9e7b5]">选择不同的外观组合，打造独一无二的角色形象</p>
            <div className="text-[7px] text-[#ffd36e] mt-1 tracking-wider">PIXEL AVATAR STATION</div>
          </div>
          <div className="w-[200px]"></div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-[280px_minmax(0,1fr)_280px] gap-0 h-[calc(100vh-80px)] max-h-[850px]">
          {/* Left Sidebar - Layer Selection */}
          <div className="bg-gradient-to-b from-[#efe4c7] to-[#e5d7b6] p-3.5 border-r-4 border-[#2c213d] overflow-y-auto max-h-[760px]">
            {(["hair", "eyes", "character", "tops", "bottoms", "shoes"] as Array<keyof CharacterAppearance>).map(
              (layer) => (
                <LayerSection
                  key={layer}
                  layer={layer}
                  currentLayers={currentLayers}
                  selectLayer={selectLayer}
                  layerVariants={layerVariants}
                  layerFiles={layerFiles}
                  getLayerFolder={getLayerFolder}
                  basePath={basePath}
                  currentDirection={currentDirectionRef.current}
                />
              )
            )}
          </div>

          {/* Center - Preview */}
          <div className="p-4 flex flex-col items-center justify-start bg-gradient-to-b from-[#f8f1df] to-[#f4e8cb] min-h-[760px]">
            {/* Static Previews */}
            <AssetWindow className="mb-3 w-full" contentClassName="bg-[rgba(255,255,255,0.4)]">
              <div className="font-game-display text-sm tracking-wider text-[#2c213d] font-bold bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white px-4 py-2 -mx-8 -mt-7 mb-4 border-b-4 border-[#2c213d]">
                四向预览
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  { ref: staticCanvasRefs.front, label: "前" },
                  { ref: staticCanvasRefs.back, label: "后" },
                  { ref: staticCanvasRefs.left, label: "左" },
                  { ref: staticCanvasRefs.right, label: "右" },
                ].map(({ ref, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 p-2.5 bg-gradient-to-b from-white to-[#f5f5f5] border-4 border-[#2c213d] shadow-md"
                  >
                    <canvas ref={ref} width="64" height="64" className="w-16 h-16" style={{ imageRendering: "pixelated" }} />
                    <span className="text-sm font-semibold text-[#2f213f]">{label}</span>
                  </div>
                ))}
              </div>
            </AssetWindow>

            {/* Interactive Preview */}
            <div className="relative">
              <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 bg-gradient-to-r from-[#4a90e2] to-[#357abd] px-6 py-2.5 border-3 border-white/30 shadow-lg">
                <div className="text-white font-game-ui text-sm font-semibold tracking-wide">
                  自由活动区 (WASD 控制)
                </div>
              </div>
              <canvas
                ref={previewCanvasRef}
                width="640"
                height="480"
                className="border-[6px] border-[#2c213d] shadow-2xl w-full h-auto"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>

          {/* Right Sidebar - Actions */}
          <div className="bg-gradient-to-b from-[#efe4c7] to-[#e5d7b6] p-3.5 border-l-4 border-[#2c213d]">
            <div className="flex flex-col gap-2.5 items-center">
              <AssetButton onClick={randomizeAppearance} className="text-base">
                随机生成
              </AssetButton>

              <AssetButton
                onClick={saveAndContinue}
                disabled={loading}
                skin="blue"
                className="text-base"
              >
                {loading ? "保存中..." : "保存并继续"}
              </AssetButton>

              <AssetButton onClick={resetToDefault} className="text-base">
                重置
              </AssetButton>

              <AssetLinkButton href="/game" className="text-base">
                返回游戏
              </AssetLinkButton>
            </div>

            <AssetWindow className="mt-7" contentClassName="bg-[rgba(255,255,255,0.35)]">
              <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-[#6f492a]">小提示</div>
              <div className="mt-4 font-game-ui text-xs leading-7 text-[#6a4529]">
                • 点击图层选项进行选择
                <br />
                • 使用 WASD 键控制角色移动
                <br />
                • 使用随机生成快速创建
                <br />• 保存后可随时修改
              </div>
            </AssetWindow>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayerSection({
  layer,
  currentLayers,
  selectLayer,
  layerVariants,
  layerFiles,
  getLayerFolder,
  basePath,
  currentDirection,
}: {
  layer: keyof CharacterAppearance;
  currentLayers: CharacterAppearance;
  selectLayer: (layer: keyof CharacterAppearance, index: number) => void;
  layerVariants: Record<keyof CharacterAppearance, number>;
  layerFiles: Record<keyof CharacterAppearance, string>;
  getLayerFolder: (layer: keyof CharacterAppearance) => string;
  basePath: string;
  currentDirection: "Front" | "Back" | "Left" | "Right";
}) {
  const layerIcons = {
    hair: "fa-head-side",
    eyes: "fa-eye",
    character: "fa-user",
    tops: "fa-shirt",
    bottoms: "fa-person",
    shoes: "fa-shoe-prints",
  };

  const layerNames = {
    hair: "头发",
    eyes: "眼睛",
    character: "身体",
    tops: "上衣",
    bottoms: "裤子",
    shoes: "鞋子",
  };

  return (
    <div className="mb-6 bg-[#fff9e9]/70 border-[3px] border-[#2c213d]/20 shadow-inner p-3.5">
      <div className="flex items-center gap-2.5 text-2xl text-[#35274f] mb-3.5 uppercase tracking-wide">
        <i className={`fas ${layerIcons[layer]} text-lg w-[22px] text-[#d66f12]`}></i>
        <span>{layerNames[layer]}</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: layerVariants[layer] }).map((_, i) => (
          <LayerOption
            key={i}
            layer={layer}
            index={i}
            isActive={currentLayers[layer] === i}
            onClick={() => selectLayer(layer, i)}
            layerFiles={layerFiles}
            getLayerFolder={getLayerFolder}
            basePath={basePath}
            currentDirection={currentDirection}
          />
        ))}
      </div>
    </div>
  );
}

function LayerOption({
  layer,
  index,
  isActive,
  onClick,
  layerFiles,
  getLayerFolder,
  basePath,
  currentDirection,
}: {
  layer: keyof CharacterAppearance;
  index: number;
  isActive: boolean;
  onClick: () => void;
  layerFiles: Record<keyof CharacterAppearance, string>;
  getLayerFolder: (layer: keyof CharacterAppearance) => string;
  basePath: string;
  currentDirection: "Front" | "Back" | "Left" | "Right";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    img.onload = () => {
      let offsetY = 0;
      if (layer === "shoes") offsetY = -8;
      else if (layer === "bottoms") offsetY = -4;
      else if (layer === "tops") offsetY = -2;

      ctx.drawImage(img, 0, index * 32, 32, 32, 0, offsetY, 32, 32);
    };
    img.onerror = () => {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, 32, 32);
    };

    const fileName = layerFiles[layer];
    const folder = getLayerFolder(layer);
    const direction = layer === "eyes" && currentDirection === "Back" ? "Front" : currentDirection;
    img.src = `${basePath}/${folder}/${fileName}_${direction}-Sheet.png`;
  }, [layer, index, layerFiles, getLayerFolder, basePath, currentDirection]);

  return (
    <div
      onClick={onClick}
      className={`aspect-square border-[3px] cursor-pointer transition-all flex items-center justify-center relative overflow-hidden shadow-md ${
        isActive
          ? "border-[#4a90e2] bg-gradient-to-b from-[#a8d5ff] to-[#6eb3ff] shadow-lg"
          : "border-[#7a6c91] bg-gradient-to-b from-[#fffaf0] to-[#efe4c7] hover:border-[#6eb3ff] hover:-translate-x-0.5 hover:-translate-y-0.5"
      }`}
    >
      <canvas ref={canvasRef} width="32" height="32" className="w-full h-full" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
