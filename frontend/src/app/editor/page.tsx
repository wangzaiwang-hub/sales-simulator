"use client";

import Link from "next/link";

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#071117_0%,_#020617_100%)] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">World Builder</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">站内地图编辑器</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              这里直接承载现有的瓦片编辑器。因为现在已经跑在站内域名下，所以登录后的
              token 和地图测试数据都能和游戏页共享。
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/game"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            >
              进入游戏
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
            >
              返回首页
            </Link>
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            登录后这里会自动复用浏览器里的 `sales-simulator-token`。
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            保存到数据库后，`/game` 会读取当前用户地图进入游戏。
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            “测试地图”现在也会走站内路径，不再跳出到孤立文件页。
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-emerald-400/20 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <iframe
            src="/editor-runtime/tileset-editor"
            title="站内地图编辑器"
            className="h-[calc(100vh-220px)] min-h-[760px] w-full bg-[#1a1a1a]"
          />
        </div>
      </div>
    </main>
  );
}
