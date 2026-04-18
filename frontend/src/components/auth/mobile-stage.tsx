"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type MobileStageProps = {
  children: ReactNode;
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
};

function clampScale(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return Math.max(0.42, Math.min(1, value));
}

export function MobileStage({
  children,
  baseWidth = 1440,
  baseHeight = 900,
  className = "",
}: MobileStageProps) {
  const [viewport, setViewport] = useState({ width: baseWidth, height: baseHeight, mobile: false });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mobile = window.matchMedia("(pointer: coarse)").matches;
      setViewport({ width, height, mobile });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, [baseHeight, baseWidth]);

  const scale = useMemo(() => {
    if (!viewport.mobile) {
      return 1;
    }

    return clampScale(
      Math.min(viewport.width / baseWidth, viewport.height / baseHeight),
    );
  }, [baseHeight, baseWidth, viewport]);

  const stageWidth = baseWidth * scale;
  const stageHeight = baseHeight * scale;

  return (
    <div className={`mx-auto flex min-h-screen w-full items-center justify-center overflow-hidden px-0 ${className}`}>
      <div
        className="relative overflow-hidden"
        style={{
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
