"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MapEditorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 简单检查，不强制登录
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/game")}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
            >
              ← 返回游戏
            </button>
            <h1 className="text-xl font-bold text-white">地图编辑器</h1>
          </div>
          <div className="text-sm text-white/60">
            提示：编辑完成后记得保存到云端并设为激活
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mx-auto h-full max-w-7xl">
          <iframe
            src="/editor-runtime/map-editor"
            title="地图编辑器"
            className="h-full w-full rounded-lg border border-white/10 bg-[#1a1a1a] shadow-2xl"
            style={{ minHeight: "calc(100vh - 120px)" }}
          />
        </div>
      </div>
    </div>
  );
}
