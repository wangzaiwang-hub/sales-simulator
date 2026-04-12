"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PixelAvatarPreview } from "@/components/auth/pixel-avatar-preview";
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

        const data = await response.json();

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

          if (existingAppearance) {
            setPreviewAppearance(existingAppearance);
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
        const nextMessage =
          err instanceof Error ? err.message : "登录失败，请稍后再试。";
        setStatus("error");
        setMessage(nextMessage);
      }
    };

    void login();
  }, [router, searchParams]);

  const steps = [
    { id: "validate", label: "校验" },
    { id: "identity", label: "身份" },
    { id: "appearance", label: "外观" },
    { id: "route", label: "进入" },
  ] as const;

  const activeStepIndex = steps.findIndex((item) => item.id === stage);

  return (
    <main className="pixel-auth-bg relative min-h-screen overflow-hidden text-[#fff6d8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(115,229,255,0.18),_transparent_28%),linear-gradient(180deg,_rgba(130,91,255,0.12),_transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6">
        <div className="pixel-frame w-full overflow-hidden">
          <div className="grid gap-px bg-[#2b163d] md:grid-cols-[0.9fr_1.1fr]">
            <section className="bg-[#201434] p-5 sm:p-6">
              <div className="pixel-subframe bg-[#120a22] p-4 text-[#fff8dc]">
                <p className="font-pixel text-[10px] uppercase tracking-[0.28em] text-[#77e4ff]">
                  Sync
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {roleLabel}
                </h2>
                <PixelAvatarPreview
                  appearance={previewAppearance}
                  accentColor={currentRole?.accent ?? "#73e5ff"}
                  mode={status === "loading" ? "loading" : status}
                  className="mt-4"
                />
              </div>
            </section>

            <section className="bg-[linear-gradient(180deg,_rgba(248,234,192,0.97),_rgba(233,214,165,0.96))] p-6 text-[#2b163d] sm:p-8">
              <div className="pixel-chip text-[#2b163d]">
                {status === "loading" && "正在登录"}
                {status === "success" && "登录成功"}
                {status === "error" && "登录失败"}
              </div>

              <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                {status === "loading" && "稍等一下"}
                {status === "success" && "马上进入"}
                {status === "error" && "这次没有连上"}
              </h1>

              <p className="mt-4 max-w-lg text-base leading-8 text-[#4a2e69]">
                {message}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {steps.map((item, index) => {
                  const completed = status === "success" || index < activeStepIndex;
                  const active = status !== "success" && index === activeStepIndex;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-none border-4 px-4 py-2 text-sm font-semibold ${
                        completed
                          ? "border-[#2a7b53] bg-[#173928] text-[#e6ffef]"
                          : active
                            ? "border-[#6cdfff] bg-[#10293d] text-[#dff8ff]"
                            : "border-[#8f75b2] bg-[#fff7de] text-[#6a4a92]"
                      }`}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-none border-4 border-[#8f75b2] bg-[#fff7de] px-4 py-3 text-sm leading-7 text-[#4a2e69]">
                下一站：{destinationLabel}
              </div>

              {status === "error" ? (
                <div className="mt-6">
                  <Link
                    href="/auth/login"
                    className="pixel-secondary-button inline-flex items-center justify-center px-5 py-4 text-sm font-semibold text-[#2b163d]"
                  >
                    返回登录页
                  </Link>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-7 text-[#6a4a92]">
                  不用操作，页面会自动继续。
                </p>
              )}
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
          <div className="pixel-frame w-full max-w-xl p-8 text-center">
            <h1 className="text-3xl font-semibold">正在进入登录回调</h1>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
