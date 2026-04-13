"use client";

import {
  AssetCounter,
  AssetLinkButton,
  AssetWindow,
} from "@/components/game/mobile-casual-ui";

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,177,255,0.18),_transparent_24%),linear-gradient(180deg,_#08101b_0%,_#04070f_100%)] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="font-pixel text-[10px] uppercase tracking-[0.3em] text-[#80ddff]">
              World Builder
            </div>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">站内地图编辑器</h1>
            <p className="mt-3 max-w-2xl font-game-ui text-[14px] leading-8 text-slate-300">
              这里是偏工具感的工作台，不需要和登录页长成一个样子。它直接承载现有瓦片编辑器，登录后的 token 和地图测试数据会与游戏页共享。
            </p>
          </div>
          <div className="flex gap-3">
            <AssetLinkButton href="/game">进入游戏</AssetLinkButton>
            <AssetLinkButton href="/">返回首页</AssetLinkButton>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <AssetCounter variant="energy" label="会话" value="共享中" />
          <AssetCounter variant="gem" label="地图" value="即时同步" />
          <AssetCounter variant="coin" label="路径" value="/editor-runtime" />
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <AssetWindow className="min-h-[166px]" translucent contentClassName="bg-[rgba(24,72,168,0.16)] text-[#eff6ff]">
            <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-[#8ee5ff]">登录复用</div>
            <p className="mt-4 font-game-ui text-[13px] leading-7 text-[#dce9ff]">
              这里会直接读取浏览器里的 `sales-simulator-token`，不用再单独进一次后台。
            </p>
          </AssetWindow>
          <AssetWindow className="min-h-[166px]" translucent contentClassName="bg-[rgba(24,72,168,0.16)] text-[#eff6ff]">
            <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-[#8ee5ff]">地图同步</div>
            <p className="mt-4 font-game-ui text-[13px] leading-7 text-[#dce9ff]">
              保存到数据库后，`/game` 会直接读取当前用户地图，方便边编辑边回到小镇验证。
            </p>
          </AssetWindow>
          <AssetWindow className="min-h-[166px]" translucent contentClassName="bg-[rgba(24,72,168,0.16)] text-[#eff6ff]">
            <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-[#8ee5ff]">站内测试</div>
            <p className="mt-4 font-game-ui text-[13px] leading-7 text-[#dce9ff]">
              测试地图也走站内路径，不会再跳出到孤立文件页，联调时上下文更完整。
            </p>
          </AssetWindow>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[rgba(5,13,28,0.68)] shadow-[0_32px_90px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 px-6 py-4 font-game-ui text-[12px] tracking-[0.1em] text-[#8fdff8]">
            MAP EDITOR TERMINAL
          </div>
          <iframe
            src="/editor-runtime/tileset-editor"
            title="站内地图编辑器"
            className="h-[calc(100vh-250px)] min-h-[760px] w-full bg-[#1a1a1a]"
          />
        </div>
      </div>
    </main>
  );
}
