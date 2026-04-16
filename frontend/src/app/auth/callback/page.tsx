"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PixelAvatarPreview } from "@/components/auth/pixel-avatar-preview";
import {
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

type Status = "loading" | "success" | "error";
type Stage = "validate" | "identity" | "appearance" | "route";

const apiUrl = "";

const stageLabels: Record<Stage, string> = {
  validate: "校验授权",
  identity: "同步身份",
  appearance: "写入外观",
  route: "准备进入",
};

function FlowStep({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  const statusClass = completed
    ? "border-[#fff1af] bg-[#fff0ba] text-[#4a2a58]"
    : active
      ? "border-[#7ee5ff] bg-[rgba(126,229,255,0.18)] text-[#ebfaff]"
      : "border-white/15 bg-[rgba(255,255,255,0.04)] text-[#bfc8e6]";

  return (
    <div className={`border-2 px-3 py-2 font-game-ui text-[12px] tracking-[0.08em] ${statusClass}`}>
      {label}
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [stage, setStage] = useState<Stage>("validate");
  const [message, setMessage] = useState("正在校验授权状态...");
  const [roleLabel, setRoleLabel] = useState("临时档案");
  const [destinationLabel, setDestinationLabel] = useState("AI 小镇");
  const [previewAppearance, setPreviewAppearance] = useState<CharacterAppearance>(
    STARTER_CHARACTER_ROLES[0].appearance,
  );
  const handledRequestRef = useRef<string | null>(null);

  const currentRole = useMemo(
    () => STARTER_CHARACTER_ROLES.find((role) => role.name === roleLabel || role.id === roleLabel),
    [roleLabel],
  );

  useEffect(() => {
    try {
      const storedRole = window.sessionStorage.getItem(CHARACTER_ROLE_STORAGE_KEY);
      const storedAppearanceRaw = window.sessionStorage.getItem(
        CHARACTER_APPEARANCE_STORAGE_KEY,
      );
      const storedAppearance = storedAppearanceRaw
        ? normalizeAppearance(JSON.parse(storedAppearanceRaw))
        : null;

      if (storedRole) {
        const matchedRole = STARTER_CHARACTER_ROLES.find((role) => role.id === storedRole);
        setRoleLabel(matchedRole?.name ?? "自定义角色");
      }

      if (storedAppearance) {
        setPreviewAppearance(storedAppearance);
      }
    } catch {
      window.sessionStorage.removeItem(CHARACTER_APPEARANCE_STORAGE_KEY);
      window.sessionStorage.removeItem(CHARACTER_ROLE_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");
    const expectedState = window.sessionStorage.getItem("secondme-oauth-state");

    if (error) {
      setStatus("error");
      setMessage(`SecondMe 授权失败：${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("没有收到授权 code，请重新发起登录。");
      return;
    }

    if (!state || !expectedState || state !== expectedState) {
      setStatus("error");
      setMessage("登录状态校验失败，请重新发起登录。");
      return;
    }

    const requestKey = `${code}:${state}`;
    if (handledRequestRef.current === requestKey) {
      return;
    }
    handledRequestRef.current = requestKey;

    const login = async () => {
      try {
        setStage("identity");
        setMessage("正在同步 SecondMe 身份...");

        const redirectUri = `${window.location.origin}/auth/callback`;
        const response = await fetch(`${apiUrl}/api/auth/secondme`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, redirectUri }),
        });
        const rawText = await response.text();
        let data: any = {};

        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          data = { error: rawText || "登录失败" };
        }

        if (!response.ok) {
          const detail =
            typeof data.detail === "string"
              ? data.detail
              : data.detail
                ? JSON.stringify(data.detail)
                : "";
          throw new Error(
            detail ? `${data.error || "登录失败"}: ${detail}` : data.error || "登录失败",
          );
        }

        localStorage.setItem("sales-simulator-token", data.token);
        localStorage.setItem("sales-simulator-user", JSON.stringify(data.user));
        window.sessionStorage.removeItem("secondme-oauth-state");

        setStage("appearance");
        setMessage("正在写入角色外观...");

        const storedAppearanceRaw = window.sessionStorage.getItem(
          CHARACTER_APPEARANCE_STORAGE_KEY,
        );
        const storedAppearance = storedAppearanceRaw
          ? normalizeAppearance(JSON.parse(storedAppearanceRaw))
          : null;

        const authHeaders = {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        };

        let destination = "/game";
        let nextDestinationLabel = "AI 小镇";

        try {
          const existingAppearanceResponse = await fetch(
            `${apiUrl}/api/game/character-appearance`,
            {
              headers: { Authorization: `Bearer ${data.token}` },
            },
          );

          const existingAppearancePayload = existingAppearanceResponse.ok
            ? await existingAppearanceResponse.json()
            : null;
          const existingAppearance = normalizeAppearance(existingAppearancePayload?.appearance);

          if (existingAppearance && existingAppearancePayload?.appearance) {
            setPreviewAppearance(existingAppearance);
            destination = "/game";
            nextDestinationLabel = "AI 小镇";
            setMessage("登录成功，正在进入 AI 小镇...");
          } else if (storedAppearance) {
            const saveAppearanceResponse = await fetch(
              `${apiUrl}/api/game/character-appearance`,
              {
                method: "PUT",
                headers: authHeaders,
                body: JSON.stringify({ appearance: storedAppearance }),
              },
            );

            if (saveAppearanceResponse.ok) {
              setPreviewAppearance(storedAppearance);
            }

            destination = "/game";
            nextDestinationLabel = "AI 小镇";
            setMessage("登录成功，正在进入 AI 小镇...");
          } else {
            destination = "/character-creator";
            nextDestinationLabel = "角色工坊";
            setMessage("首次进入游戏，正在进入角色工坊...");
          }
        } catch {
          destination = "/character-creator";
          nextDestinationLabel = "角色工坊";
          setMessage("登录成功，正在进入角色工坊...");
        }

        setStage("route");
        setDestinationLabel(nextDestinationLabel);
        setStatus("success");
        window.sessionStorage.removeItem(CHARACTER_APPEARANCE_STORAGE_KEY);
        window.sessionStorage.removeItem(CHARACTER_ROLE_STORAGE_KEY);

        window.setTimeout(() => {
          router.replace(destination);
        }, 1100);
      } catch (err) {
        const nextMessage = err instanceof Error ? err.message : "登录失败，请稍后再试。";
        setStatus("error");
        setMessage(nextMessage);
      }
    };

    void login();
  }, [router, searchParams]);

  const steps = [
    { id: "validate", label: "校验授权" },
    { id: "identity", label: "同步身份" },
    { id: "appearance", label: "角色外观" },
    { id: "route", label: "进入地图" },
  ] as const;

  const activeStepIndex = steps.findIndex((item) => item.id === stage);
  const statusLabel =
    status === "loading" ? "正在登录" : status === "success" ? "登录成功" : "登录失败";
  const heading =
    status === "loading" ? "正在穿过入口" : status === "success" ? "传送完成" : "入口中断";

  return (
    <main className="pixel-auth-bg relative min-h-screen overflow-hidden text-[#fff6d8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(115,229,255,0.22),_transparent_24%),linear-gradient(180deg,_rgba(113,87,255,0.12),_transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6">
        <div className="pixel-frame w-full overflow-hidden">
          <div className="grid gap-px bg-[#2b163d] lg:grid-cols-[0.84fr_1.16fr]">
            <section className="bg-[linear-gradient(180deg,_rgba(18,10,34,0.98),_rgba(14,8,26,0.98))] p-5 sm:p-6">
              <div className="border-4 border-[#40305b] bg-[rgba(13,19,46,0.78)] p-5">
                <div className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#77e4ff]">
                  Sync Preview
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-[#fff8df]">{roleLabel}</h2>
                <PixelAvatarPreview
                  appearance={previewAppearance}
                  accentColor={currentRole?.accent ?? "#73e5ff"}
                  mode={status === "loading" ? "loading" : status}
                  className="mt-4"
                />
                <div className="mt-4 border-2 border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 font-game-ui text-[12px] leading-6 text-[#dbe7ff]">
                  当前阶段：{stageLabels[stage]}
                </div>
              </div>
            </section>

            <section className="bg-[linear-gradient(180deg,_rgba(245,238,255,0.96),_rgba(218,231,255,0.94))] p-6 text-[#112245] sm:p-8">
              <AssetWindow className="w-full" contentClassName="bg-[rgba(34,77,173,0.14)] text-[#18305a]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-[#3562b2]">
                      Gateway Status
                    </div>
                    <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#1e3765] sm:text-4xl">
                      {heading}
                    </h1>
                  </div>
                  <div className="border-2 border-[#85aaf4] bg-[#eff5ff] px-3 py-1 font-game-ui text-[10px] tracking-[0.08em] text-[#355ea8]">
                    {statusLabel}
                  </div>
                </div>

                <p className="mt-5 max-w-2xl font-game-ui text-[14px] leading-8 text-[#2d4572]">
                  {message}
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {steps.map((item, index) => {
                    const completed = status === "success" || index < activeStepIndex;
                    const active = status !== "success" && index === activeStepIndex;

                    return (
                      <FlowStep
                        key={item.id}
                        label={item.label}
                        completed={completed}
                        active={active}
                      />
                    );
                  })}
                </div>

                <div className="mt-7 border-4 border-[#8ba8dd] bg-[rgba(255,255,255,0.58)] px-5 py-4">
                  <div className="font-pixel text-[10px] uppercase tracking-[0.24em] text-[#5a77af]">下一站</div>
                  <div className="mt-3 font-game-display-tight text-2xl text-[#213b6d]">
                    {destinationLabel}
                  </div>
                </div>

                {status === "error" ? (
                  <div className="mt-6">
                    <AssetLinkButton href="/auth/login">返回登录页</AssetLinkButton>
                  </div>
                ) : (
                  <p className="mt-6 font-game-ui text-[12px] leading-6 text-[#516b98]">
                    页面会自动继续，不需要再点按钮。
                  </p>
                )}
              </AssetWindow>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="pixel-auth-bg flex min-h-screen items-center justify-center px-4 text-[#fff6d8]">
          <div className="pixel-frame w-full max-w-2xl overflow-hidden border-[#2e1b43] bg-[rgba(15,9,28,0.92)] p-8">
            <div className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#77e4ff]">
              Loading
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-[#fff8df]">正在进入登录回调</h1>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
