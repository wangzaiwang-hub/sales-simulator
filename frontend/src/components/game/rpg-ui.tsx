import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

const UI_BASE = "/UI";

const bgImage = (assetPath: string): CSSProperties => ({
  backgroundImage: `url("${UI_BASE}/${assetPath}")`,
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  imageRendering: "pixelated",
});

function PillShell({
  children,
  className,
  dark = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={clsx("pixel-art relative inline-flex min-w-[164px] items-center justify-center px-6 py-4", className)}
      style={{
        minHeight: 62,
        ...style,
      }}
    >
      {dark ? (
        <span className="absolute inset-0" style={bgImage("通用外框2.png")} />
      ) : (
        <>
          <span className="absolute inset-0" style={bgImage("通用外框.png")} />
          <span className="absolute inset-[4px]" style={bgImage("通用底色.png")} />
        </>
      )}
      <span
        className={clsx(
          "font-game-ui relative z-10 text-center text-[13px] leading-none tracking-[0.08em]",
          dark ? "text-[#ffde8f]" : "text-[#402251]",
        )}
      >
        {children}
      </span>
    </span>
  );
}

export function RpgButton({
  children,
  className,
  dark = false,
  style,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  dark?: boolean;
}) {
  return (
    <button
      type={type}
      className="inline-flex bg-transparent transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      <PillShell className={className} dark={dark} style={style}>
        {children}
      </PillShell>
    </button>
  );
}

export function RpgLinkButton({
  children,
  className,
  dark = false,
  href,
  style,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  href: string;
  style?: CSSProperties;
}) {
  return (
    <Link href={href} className="inline-flex bg-transparent no-underline transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5">
      <PillShell className={className} dark={dark} style={style}>
        {children}
      </PillShell>
    </Link>
  );
}

export function RpgAnchorButton({
  children,
  className,
  dark = false,
  href,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  href: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex bg-transparent no-underline transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5"
    >
      <PillShell className={className} dark={dark} style={style}>
        {children}
      </PillShell>
    </a>
  );
}

export function RpgChip({
  children,
  className,
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <PillShell dark={dark} className={clsx("min-w-0 px-4 py-2", className)} style={{ minHeight: 42 }}>
      <span className={clsx("font-game-ui text-[11px] tracking-[0.08em]", dark ? "text-[#ffe3a1]" : "text-[#4a2a58]")}>
        {children}
      </span>
    </PillShell>
  );
}

export function RpgBadge({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string | number;
  dark?: boolean;
}) {
  return (
    <PillShell dark={dark} className="min-w-[132px] gap-2 px-4 py-2.5" style={{ minHeight: 48 }}>
      <span className={clsx("font-game-ui text-[10px] uppercase tracking-[0.08em]", dark ? "text-[#f3ca6a]" : "text-[#7d4d2a]")}>
        {label}
      </span>
      <span className={clsx("font-game-display-tight text-[13px]", dark ? "text-[#fff0b8]" : "text-[#38204d]")}>
        {value}
      </span>
    </PillShell>
  );
}

export function RpgKeyBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-[8px] border-[3px] border-[#342046] bg-[#fff1b7] px-4 py-1.5 align-middle shadow-[0_3px_0_rgba(39,20,63,0.45)]">
      <span className="font-game-display-tight text-[18px] tracking-[0.02em] text-[#3e2555]">{children}</span>
    </span>
  );
}

export function RpgPromptPanel({
  children,
  className,
  title = "对话提示",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={clsx("pixel-art relative max-w-[calc(100vw-24px)]", className)}
      style={bgImage("对话框样式/对话框底色.png")}
    >
      <div className="font-game-ui absolute left-7 top-2.5 text-[11px] tracking-[0.08em] text-[#4a2a58]">{title}</div>
      <div className="flex min-h-[74px] items-center px-8 pb-3 pt-9 text-[13px] leading-7 text-[#4a2a58]">{children}</div>
    </div>
  );
}

export function RpgPanel({
  children,
  className,
  contentClassName,
  title,
  titleAlign = "left",
  variant = "left",
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  title?: ReactNode;
  titleAlign?: "left" | "right";
  variant?: "left" | "right";
}) {
  const isRight = titleAlign === "right";
  const assetPath = variant === "right" ? "对话框样式/对话框底色2.png" : "对话框样式/对话框底色.png";

  return (
    <div className={clsx("pixel-art relative", className)} style={bgImage(assetPath)}>
      {title ? (
        <div
          className={clsx(
            "font-game-ui absolute top-2.5 text-[11px] tracking-[0.08em] text-[#4a2a58]",
            isRight ? "right-7" : "left-7",
          )}
        >
          {title}
        </div>
      ) : null}
      <div className={clsx("px-8 pb-5 pt-12 text-[13px] leading-7 text-[#4a2a58]", contentClassName)}>{children}</div>
    </div>
  );
}

export function RpgOrbButton({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("pixel-art relative inline-flex h-[72px] w-[72px] items-center justify-center bg-transparent transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5", className)}
      style={bgImage("虚拟按钮/触摸.png")}
    >
      <span className="font-game-ui relative z-10 text-[11px] tracking-[0.08em] text-[#402251]">{children}</span>
    </button>
  );
}
