"use client";

import { useEffect, useState } from "react";
import { AssetLinkButton } from "@/components/game/mobile-casual-ui";

export default function Home() {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/shouye.gif";
    img.onload = () => setImageLoaded(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* 背景图片 */}
      <div className="absolute inset-0">
        {imageLoaded ? (
          <img
            src="/shouye.gif"
            alt="游戏背景"
            className="w-full h-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>

      {/* 进入游戏按钮 - 右下角 */}
      <div className="absolute bottom-8 right-8 z-10">
        <AssetLinkButton
          href="/auth/login"
          skin="yellow"
          className="text-[18px] pl-5"
        >
          进入游戏
        </AssetLinkButton>
      </div>
    </div>
  );
}
