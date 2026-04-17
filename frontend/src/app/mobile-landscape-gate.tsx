"use client";

import { useEffect, useState } from "react";

export default function MobileLandscapeGate() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [orientationHint, setOrientationHint] = useState("");

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
      setOrientationHint("当前浏览器不能直接自动横屏，请关闭系统方向锁定后横过手机，再点一次。");
      return false;
    }
  };

  useEffect(() => {
    if (!isPortraitMobile) {
      setOrientationHint("");
      return;
    }
    void requestLandscapeMode();
  }, [isPortraitMobile]);

  if (!isPortraitMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(4,9,20,0.94)] px-5 py-6 backdrop-blur-[3px]">
      <div className="pixel-frame max-w-[360px] overflow-hidden">
        <div className="bg-[linear-gradient(180deg,_rgba(19,13,37,0.98),_rgba(10,9,24,0.98))] p-5 text-center">
          <div className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#74ecff]">
            Landscape Mode
          </div>
          <div className="mt-4 font-game-display-tight text-[28px] leading-tight text-[#fff3c8]">
            请横屏游玩
          </div>
          <p className="mt-4 font-game-ui text-[13px] leading-7 text-[#d7def6]">
            我们会优先尝试进入真正的横屏和全屏模式。这样地图、编辑器和登录流程都会完整显示。
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
            {orientationHint || "如果没有自动切换，请先关闭系统方向锁定，再把手机横过来。"}
          </div>
        </div>
      </div>
    </div>
  );
}
