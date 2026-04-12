"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/resource/shouye.gif";
    img.onload = () => setImageLoaded(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* 背景动图 */}
      <div className="absolute inset-0">
        {imageLoaded ? (
          <img 
            src="/resource/shouye.gif" 
            alt="游戏背景"
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>

      {/* 进入游戏按钮 - 右下角 */}
      <div className="absolute bottom-12 right-12 z-10">
        <Link
          href="/auth/login"
          className="group relative block"
        >
          {/* 像素风格按钮 */}
          <div 
            className="relative px-10 py-4 bg-green-500 border-2 border-white
                       hover:bg-green-400 transition-colors duration-100
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                       active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                       active:translate-x-1 active:translate-y-1"
            style={{ imageRendering: 'pixelated' }}
          >
            <span 
              className="text-white font-bold"
              style={{ 
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontSize: '16px',
                textShadow: '2px 2px 0px rgba(0,0,0,1)',
                letterSpacing: '0.05em'
              }}
            >
              进入游戏
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
