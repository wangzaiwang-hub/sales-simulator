"use client";

import { useEffect, useMemo, useState } from "react";

import { PixelAvatarPreview } from "@/components/auth/pixel-avatar-preview";
import {
  AssetAnchorButton,
  AssetLinkButton,
  AssetWindow,
} from "@/components/game/mobile-casual-ui";
import {
  CHARACTER_APPEARANCE_STORAGE_KEY,
  CHARACTER_ROLE_STORAGE_KEY,
  STARTER_CHARACTER_ROLES,
  normalizeAppearance,
  type CharacterAppearance,
} from "@/lib/character-appearance";

const rawClientId = process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID;
const SECONDME_AUTHORIZE_URL = "https://go.second-me.cn/oauth/";
const SECONDME_OAUTH_STATE_KEY = "secondme-oauth-state";

const townSignals = [
  {
    image: "/UI/角色卡片/剑士-未选.png",
    label: "广场动线",
    title: "先看谁刚停下来",
    description: "人流会动，机会也会动。停留、转身和驻足比盲聊更有价值。",
  },
  {
    image: "/UI/角色卡片/医师-未选.png",
    label: "情绪线索",
    title: "谁更愿意回应你",
    description: "居民都有自己的情绪和节奏，别把每个数字分身都当成同一种客户。",
  },
  {
    image: "/UI/角色卡片/魔法师-未选.png",
    label: "成交时机",
    title: "谁现在最有需求",
    description: "时机对了，短对话也能成单。时机不对，再多话术也只会打扰。",
  },
] as const;

function SignalCard({
  image,
  label,
  title,
  description,
}: (typeof townSignals)[number]) {
  const imageSrc = encodeURI(image);

  return (
    <div className="overflow-hidden border-4 border-[#3a2553] bg-[rgba(20,12,35,0.92)] shadow-[8px_8px_0_rgba(12,7,23,0.34)]">
      <div className="relative">
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="block h-[176px] w-full object-cover object-top pixel-art"
        />
        <div className="absolute left-3 top-3 bg-[rgba(29,18,47,0.86)] px-2 py-1 font-game-ui text-[10px] tracking-[0.08em] text-[#ffe39a]">
          {label}
        </div>
      </div>
      <div className="border-t-4 border-[#3a2553] px-4 py-3">
        <div className="font-game-display-tight text-[16px] text-[#fff8df]">{title}</div>
        <p className="mt-2 font-game-ui text-[12px] leading-6 text-[#d6c8ef]">{description}</p>
      </div>
    </div>
  );
}

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
    const clientId = rawClientId?.trim();
    const redirectUri =
      process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI?.trim() ||
      `${window.location.origin}/auth/callback`;

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
    window.sessionStorage.setItem(SECONDME_OAUTH_STATE_KEY, state);
    window.localStorage.setItem(SECONDME_OAUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "userinfo",
      state,
    });

    setAuthorizeUrl(`${SECONDME_AUTHORIZE_URL}?${params.toString()}`);
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(115,229,255,0.16),_transparent_24%),linear-gradient(180deg,_rgba(255,158,90,0.08),_transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(180deg,_transparent,_rgba(10,6,19,0.96)_85%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-6 sm:px-6">
        <div className="pixel-frame overflow-hidden">
          <div className="grid gap-px bg-[#2b163d] lg:grid-cols-[1.12fr_0.88fr]">
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

              <div className="mt-5 max-w-xl border-4 border-[#3c2556] bg-[rgba(255,241,200,0.92)] px-5 py-4 text-[#4d2c5e] shadow-[10px_10px_0_rgba(17,10,28,0.28)]">
                <div className="font-pixel text-[10px] uppercase tracking-[0.26em] text-[#7c4d23]">小提示</div>
                <p className="mt-3 text-base leading-8 sm:text-lg">
                  镇上的居民是真实人类的数字分身，他们不会排队等你推销。先观察谁正在生活、谁刚好有需求，再决定先和谁开口。
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {townSignals.map((signal) => (
                  <SignalCard key={signal.label} {...signal} />
                ))}
              </div>

              <div className="mt-8 max-w-xl">
                {authorizeUrl ? (
                  <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
                    <AssetLinkButton
                      href="/"
                      className="w-full text-[14px]"
                      style={{ minWidth: "100%", minHeight: 72 }}
                    >
                      返回首页
                    </AssetLinkButton>
                    <AssetAnchorButton
                      href={authorizeUrl}
                      onClick={handleAuthorize}
                      skin="play"
                      className="w-full text-[15px]"
                      style={{ minWidth: "100%", minHeight: 74 }}
                    >
                     SecondMe登录
                    </AssetAnchorButton>
                  </div>
                ) : (
                  <div className="pixel-warning">
                    缺少 SecondMe 前端环境变量，请检查
                    <code className="mx-1">frontend/.env.local</code>
                    中的
                    <code className="mx-1">NEXT_PUBLIC_SECONDME_CLIENT_ID</code>。
                  </div>
                )}

                <p className="mt-4 text-sm leading-7 text-[#cabce3]">
                  登录后会直接进入小镇。这里不是捏脸入口，而是开场大厅，你会从这里直接进入居民正在生活的地图。
                </p>
              </div>
            </section>

            <section className="bg-[linear-gradient(180deg,_rgba(247,233,196,0.98),_rgba(234,214,173,0.96))] p-5 sm:p-6">
              <AssetWindow
                className="h-full"
                translucent
                contentClassName="h-full bg-[rgba(13,19,46,0.76)] text-[#eff4ff]"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#77e4ff]">
                        Scene Preview
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">
                        像素小镇现场
                      </h2>
                    </div>
                    <div className="rounded-full border-2 border-[#dff4ff] bg-[rgba(217,242,255,0.18)] px-3 py-1 font-game-ui text-[10px] tracking-[0.08em] text-[#e7fbff]">
                      登录后直达
                    </div>
                  </div>

                  <PixelAvatarPreview
                    appearance={appearance}
                    accentColor={selectedRole?.accent ?? "#73e5ff"}
                    className="mt-4"
                  />

                  <div className="mt-4 space-y-3 text-sm leading-7 text-[#e3ebff]">
                    <p>
                      这里不是站柜台等客的商店，而是一个持续运转的 AI 小镇。每次进入，都是从居民的日常里找与你产品相交的那一刻。
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="border-2 border-white/20 bg-[rgba(255,255,255,0.06)] px-3 py-2">真实数字分身</div>
                      <div className="border-2 border-white/20 bg-[rgba(255,255,255,0.06)] px-3 py-2">先观察再开口</div>
                    </div>
                  </div>
                </div>
              </AssetWindow>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
