"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CHARACTER_LAYER_ORDER,
  DEFAULT_CHARACTER_APPEARANCE,
  type CharacterAppearance,
  getCharacterLayerSheet,
} from "@/lib/character-appearance";

type PixelAvatarPreviewProps = {
  appearance?: CharacterAppearance | null;
  accentColor?: string;
  mode?: "idle" | "loading" | "success" | "error";
  className?: string;
};

const previewDirections = ["Front", "Right", "Back", "Left"] as const;

export function PixelAvatarPreview({
  appearance = DEFAULT_CHARACTER_APPEARANCE,
  accentColor = "#78d7ff",
  mode = "idle",
  className = "",
}: PixelAvatarPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const [tick, setTick] = useState(0);
  const safeAppearance = appearance ?? DEFAULT_CHARACTER_APPEARANCE;

  const activeDirection = useMemo(
    () => previewDirections[Math.floor(tick / 6) % previewDirections.length],
    [tick],
  );
  const activeFrame = useMemo(() => tick % 4, [tick]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((current) => current + 1);
    }, mode === "loading" ? 120 : 180);

    return () => {
      window.clearInterval(interval);
    };
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const cached = imageCacheRef.current[src];
        if (cached) {
          resolve(cached);
          return;
        }

        const img = new Image();
        img.onload = () => {
          imageCacheRef.current[src] = img;
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const drawPreview = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackdrop(ctx, canvas.width, canvas.height, accentColor, mode, tick);

      for (const layer of CHARACTER_LAYER_ORDER) {
        if (layer === "eyes" && activeDirection === "Back") {
          continue;
        }

        const img = await loadImage(getCharacterLayerSheet(layer, activeDirection));
        if (!img || cancelled) {
          continue;
        }

        ctx.drawImage(
          img,
          activeFrame * 32,
          safeAppearance[layer] * 32,
          32,
          32,
          64,
          48,
          96,
          96,
        );
      }
    };

    void drawPreview();

    return () => {
      cancelled = true;
    };
  }, [accentColor, activeDirection, activeFrame, mode, safeAppearance, tick]);

  return (
    <div className={`pixel-stage pixel-scanlines relative overflow-hidden ${className}`.trim()}>
      <div
        className="absolute inset-x-8 top-4 h-6 rounded-full opacity-80 blur-2xl"
        style={{ backgroundColor: accentColor }}
      />
      <canvas
        ref={canvasRef}
        width={224}
        height={192}
        className="relative z-10 h-auto w-full pixel-art"
        aria-label="角色像素预览"
      />
    </div>
  );
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string,
  mode: PixelAvatarPreviewProps["mode"],
  tick: number,
) {
  ctx.fillStyle = "#140d26";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#1f1236";
  ctx.fillRect(0, 0, width, 64);

  for (let x = 0; x < width; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? "#2a1a48" : "#24143f";
    ctx.fillRect(x, 64, 16, 48);
  }

  ctx.fillStyle = "#0d0818";
  ctx.fillRect(0, 112, width, 80);

  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(18, 32, 36, 12);
  ctx.fillRect(width - 54, 20, 28, 10);
  ctx.globalAlpha = 1;

  for (let x = 0; x < width; x += 16) {
    for (let y = 112; y < height; y += 16) {
      ctx.fillStyle = (x + y) % 32 === 0 ? "#27193f" : "#1b112f";
      ctx.fillRect(x, y, 16, 16);
    }
  }

  ctx.fillStyle = "#3a245b";
  ctx.fillRect(56, 132, 112, 28);
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.28;
  ctx.fillRect(56, 132, 112, 6);
  ctx.globalAlpha = 1;

  if (mode === "loading") {
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(48, 22 + ((tick * 10) % 110), 128, 10);
    ctx.globalAlpha = 1;
  }

  if (mode === "success") {
    ctx.fillStyle = "#9afc9a";
    ctx.fillRect(18, 18, 8, 8);
    ctx.fillRect(width - 26, 28, 8, 8);
  }

  if (mode === "error") {
    ctx.fillStyle = "#ff7c7c";
    ctx.fillRect(18, 18, 8, 8);
    ctx.fillRect(width - 26, 28, 8, 8);
  }
}
