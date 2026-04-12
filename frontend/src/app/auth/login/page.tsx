"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PixelAvatarPreview } from "@/components/auth/pixel-avatar-preview";
import {
  CHARACTER_APPEARANCE_STORAGE_KEY,
  CHARACTER_ROLE_STORAGE_KEY,
  STARTER_CHARACTER_ROLES,
  normalizeAppearance,
  type CharacterAppearance,
} from "@/lib/character-appearance";

const clientId = process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID;

export default function LoginPage() {
  const defaultRole = STARTER_CHARACTER_ROLES[0];
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(defaultRole.id);
  const [appearance, setAppearance] = useState<CharacterAppearance>(defaultRole.appearance);

  const selectedRole = useMemo(
    () => STARTER_CHARACTER_ROLES.find((role) => role.id === selectedRoleId) ?? null,
    [selectedRoleId],
  );

  useEffect(() => {
    const redirectUri = `${window.location.origin}/auth/callback`;

    try {
      const storedRoleId = window.sessionStorage.getItem(CHARACTER_ROLE_STORAGE_KEY);
      const storedAppearanceRaw = window.sessionStorage.getItem(
        CHARACTER_APPEARANCE_STORAGE_KEY,
      );
      const storedAppearance = storedAppearanceRaw
        ? normalizeAppearance(JSON.parse(storedAppearanceRaw))
        : null;

      const presetRole = STARTER_CHARACTER_ROLES.find((role) => role.id === storedRoleId);
      if (presetRole) {
        setSelectedRoleId(presetRole.id);
        setAppearance(storedAppearance ?? presetRole.appearance);
      } else if (storedAppearance) {
        setSelectedRoleId("custom");
        setAppearance(storedAppearance);
      }
    } catch {
      window.sessionStorage.removeItem(CHARACTER_APPEARANCE_STORAGE_KEY);
      window.sessionStorage.removeItem(CHARACTER_ROLE_STORAGE_KEY);
    }

    if (!clientId) {
      setAuthorizeUrl(null);
      return;
    }

    const state = crypto.randomUUID();
    window.sessionStorage.setItem("secondme-oauth-state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "userinfo",
      state,
    });

    setAuthorizeUrl(`https://go.second-me.cn/oauth/?${params.toString()}`);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      CHARACTER_APPEARANCE_STORAGE_KEY,
      JSON.stringify(appearance),
    );
    window.sessionStorage.setItem(CHARACTER_ROLE_STORAGE_KEY, selectedRoleId);
  }, [appearance, selectedRoleId]);

  const handleAuthorize = () => {
    window.sessionStorage.setItem(
      CHARACTER_APPEARANCE_STORAGE_KEY,
      JSON.stringify(appearance),
    );
    window.sessionStorage.setItem(
      CHARACTER_ROLE_STORAGE_KEY,
      selectedRole?.id ?? "custom",
    );
  };

  return (
    <main className="pixel-auth-bg relative min-h-screen overflow-hidden text-[#fff6d8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(115,229,255,0.18),_transparent_28%),linear-gradient(180deg,_rgba(255,152,103,0.12),_transparent_40%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,_transparent,_rgba(12,7,23,0.98)_80%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-6 sm:px-6">
        <div className="mb-4">
          <Link href="/" className="pixel-chip w-fit text-[#fdf0ca] transition hover:text-white">
            返回首页
          </Link>
        </div>

        <div className="pixel-frame overflow-hidden">
          <div className="grid gap-px bg-[#2b163d] lg:grid-cols-[1.1fr_0.9fr]">
            <section className="bg-[linear-gradient(180deg,_rgba(24,15,41,0.98),_rgba(16,10,29,0.98))] p-6 sm:p-8">
              <p className="font-pixel text-[10px] uppercase tracking-[0.32em] text-[#73e5ff]">
                SecondMe Login
              </p>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-[#fff8dc] sm:text-5xl">
                欢迎
                <span className="mt-2 block font-pixel text-lg uppercase tracking-[0.24em] text-[#ffcb71] sm:text-2xl">
                  进入 AI 小镇
                </span>
              </h1>

              <div className="mt-5 max-w-xl rounded-none border-4 border-[#ffcb71] bg-[linear-gradient(180deg,_rgba(255,203,113,0.2),_rgba(255,203,113,0.08))] px-4 py-4 text-[#fff7de] shadow-[0_0_0_4px_rgba(42,21,62,0.35)]">
                <p className="font-pixel text-[10px] uppercase tracking-[0.22em] text-[#ffe08f]">
                  小提示
                </p>
                <p className="mt-3 text-base leading-8 text-[#f5e9ff] sm:text-lg">
                  镇上的居民是真实人类的数字分身，他们不会排队等你推销。先观察谁正在生活、谁刚好有需求，再决定先和谁开口。
                </p>
              </div>

              <div className="mt-6 grid gap-3 text-sm leading-7 text-[#e7dbff] sm:grid-cols-3">
                <div className="rounded-none border-4 border-white/10 bg-white/5 px-4 py-3">
                  <p className="font-pixel text-[9px] uppercase tracking-[0.18em] text-[#8de6ff]">
                    数字分身
                  </p>
                  <p className="mt-2 text-[#fff7de]">每个客户都像住在镇里的真人，有自己的性格、节奏和偏好。</p>
                </div>
                <div className="rounded-none border-4 border-white/10 bg-white/5 px-4 py-3">
                  <p className="font-pixel text-[9px] uppercase tracking-[0.18em] text-[#8de6ff]">
                    镇中寻找
                  </p>
                  <p className="mt-2 text-[#fff7de]">他们不会排队等你推销，你得在街道、广场和日常生活里找到机会。</p>
                </div>
                <div className="rounded-none border-4 border-white/10 bg-white/5 px-4 py-3">
                  <p className="font-pixel text-[9px] uppercase tracking-[0.18em] text-[#8de6ff]">
                    销售判断
                  </p>
                  <p className="mt-2 text-[#fff7de]">先读人，再开口。时机、话术和目标人选，都会影响你能不能卖出去。</p>
                </div>
              </div>

              <div className="mt-8 max-w-xl space-y-3">
                {authorizeUrl ? (
                  <a
                    href={authorizeUrl}
                    onClick={handleAuthorize}
                    className="pixel-button inline-flex w-full items-center justify-center px-6 py-5 text-center font-pixel text-[11px] uppercase tracking-[0.24em] text-[#1a1127]"
                  >
                    使用 SecondMe 登录
                  </a>
                ) : (
                  <div className="pixel-warning">
                    缺少 SecondMe 前端环境变量，请检查
                    <code className="mx-1">frontend/.env.local</code>
                    中的
                    <code className="mx-1">NEXT_PUBLIC_SECONDME_CLIENT_ID</code>。
                  </div>
                )}

                <p className="text-sm leading-7 text-[#cabce3]">
                  登录后会直接进入小镇。角色外观只是辅助信息，重点是尽快进场找人、聊人、卖出第一单。
                </p>
              </div>
            </section>

            <section className="bg-[linear-gradient(180deg,_rgba(248,234,192,0.97),_rgba(233,214,165,0.96))] p-5 text-[#2b163d] sm:p-6">
              <div className="pixel-subframe bg-[#211435] p-4 text-[#fff7de]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#77e4ff]">
                      Game Preview
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">
                      像素小镇现场
                    </h2>
                  </div>
                  <div className="pixel-chip text-[#bff2ff]">实机预览</div>
                </div>

                <PixelAvatarPreview
                  appearance={appearance}
                  accentColor={selectedRole?.accent ?? "#73e5ff"}
                  className="mt-4"
                />

                <div className="mt-4 space-y-3 text-sm leading-7 text-[#e3d8f5]">
                  <p>
                    进入小镇后，你要主动靠近那些正在生活中的数字分身。有人在闲逛，有人在忙事，也有人刚好正需要你卖的东西。
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-none border-2 border-white/10 bg-white/5 px-3 py-2">真实数字分身</div>
                    <div className="rounded-none border-2 border-white/10 bg-white/5 px-3 py-2">在镇中找客户</div>
                    <div className="rounded-none border-2 border-white/10 bg-white/5 px-3 py-2">观察后再成交</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
