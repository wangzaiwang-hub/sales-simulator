import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

const UI_BASE = "/3c24f09e57876183/MobileCasualUI_English";

const imageStyle = (assetPath: string): CSSProperties => ({
  backgroundImage: `url("${UI_BASE}/${assetPath}")`,
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "100% 100%",
  imageRendering: "pixelated",
});

const buttonSkins = {
  play: {
    assetPath: "Buttons/Empty_Play_Button.png",
    minWidth: 164,
    minHeight: 68,
    textClassName: "text-[#754118]",
  },
  default: {
    assetPath: "Buttons/Empty_Button.png",
    minWidth: 132,
    minHeight: 62,
    textClassName: "text-[#754118]",
  },
  yellow: {
    assetPath: "Buttons/Empty_Button- Yellow.png",
    minWidth: 132,
    minHeight: 62,
    textClassName: "text-[#754118]",
  },
  blue: {
    assetPath: "Buttons/Empty_Button.png",
    minWidth: 132,
    minHeight: 62,
    textClassName: "text-[#754118]",
  },
  mode: {
    assetPath: "Buttons/Empty_Mode_Button.png",
    minWidth: 132,
    minHeight: 68,
    textClassName: "text-[#754118]",
  },
} as const;

type ButtonSkin = keyof typeof buttonSkins;

function AssetButtonInner({
  children,
  className,
  icon,
  skin = "default",
  style,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  skin?: ButtonSkin;
  style?: CSSProperties;
}) {
  const skinConfig = buttonSkins[skin];

  return (
    <span
      className={clsx(
        "pixel-art relative inline-flex select-none items-center justify-center gap-2 bg-transparent px-6 pb-2 pt-1.5 text-center transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5",
        skinConfig.textClassName,
        className,
      )}
      style={{
        ...imageStyle(skinConfig.assetPath),
        minWidth: skinConfig.minWidth,
        minHeight: skinConfig.minHeight,
        ...style,
      }}
    >
      {icon ? <span className="relative z-10 flex h-5 w-5 items-center justify-center">{icon}</span> : null}
      <span className={clsx("font-game-ui relative z-10 font-semibold leading-none tracking-[0.08em]", className)}>
        {children}
      </span>
    </span>
  );
}

export function AssetButton({
  children,
  className,
  icon,
  skin = "default",
  style,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  skin?: ButtonSkin;
}) {
  return (
    <button type={type} className="inline-flex bg-transparent disabled:cursor-not-allowed disabled:opacity-60" {...props}>
      <AssetButtonInner className={className} icon={icon} skin={skin} style={style}>
        {children}
      </AssetButtonInner>
    </button>
  );
}

export function AssetLinkButton({
  children,
  className,
  href,
  icon,
  skin = "default",
  style,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  icon?: ReactNode;
  skin?: ButtonSkin;
  style?: CSSProperties;
}) {
  return (
    <Link href={href} className="inline-flex bg-transparent no-underline">
      <AssetButtonInner className={className} icon={icon} skin={skin} style={style}>
        {children}
      </AssetButtonInner>
    </Link>
  );
}

export function AssetAnchorButton({
  children,
  className,
  href,
  icon,
  skin = "default",
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  icon?: ReactNode;
  skin?: ButtonSkin;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex bg-transparent no-underline"
    >
      <AssetButtonInner className={className} icon={icon} skin={skin} style={style}>
        {children}
      </AssetButtonInner>
    </a>
  );
}

const iconButtons = {
  close: { assetPath: "Buttons/Off_Button.png", width: 36, height: 36 },
  menu: { assetPath: "Buttons/Menu_Button.png", width: 52, height: 52 },
  letter: { assetPath: "Buttons/Letter_Button.png", width: 52, height: 52 },
  settings: { assetPath: "Buttons/Setting_Button.png", width: 52, height: 52 },
} as const;

export function AssetIconButton({
  className,
  icon,
  label,
  style,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  label: string;
  variant: keyof typeof iconButtons;
}) {
  const buttonConfig = iconButtons[variant];
  const hoverRingClassName =
    variant === "menu"
      ? "border-[#8de9ff] bg-[rgba(92,196,255,0.18)] shadow-[0_0_0_2px_rgba(255,255,255,0.08),0_0_18px_rgba(92,196,255,0.32)]"
      : "border-[#ffd88a] bg-[rgba(255,216,138,0.16)] shadow-[0_0_0_2px_rgba(255,255,255,0.06),0_0_14px_rgba(255,216,138,0.26)]";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "group pixel-art relative inline-flex items-center justify-center bg-transparent transition duration-150 hover:-translate-y-0.5 hover:scale-[1.05] active:translate-y-0.5",
        className,
      )}
      style={{
        ...imageStyle(buttonConfig.assetPath),
        width: buttonConfig.width,
        height: buttonConfig.height,
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute inset-[-4px] z-0 border-2 opacity-0 transition duration-150 group-hover:opacity-100",
          hoverRingClassName,
        )}
      />
      {icon ? <span className="text-[#6e3f1c]">{icon}</span> : <span className="sr-only">{label}</span>}
    </button>
  );
}

export function AssetWindow({
  children,
  className,
  contentClassName,
  translucent = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  translucent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={clsx("pixel-art relative", className)}
      style={{
        ...imageStyle(translucent ? "Windows/Translucent_Window.png" : "Windows/Window.png"),
        ...style,
      }}
    >
      <div className={clsx("h-full w-full px-8 py-7", contentClassName)}>{children}</div>
    </div>
  );
}

const counterSkins = {
  coin: {
    barPath: "CountBar/Coin_CountBar.png",
    iconPath: "Icons/Coin_Icon.png",
    textClassName: "text-[#73421f]",
  },
  energy: {
    barPath: "CountBar/Energy_CountBar.png",
    iconPath: "Icons/Energy_Icon.png",
    textClassName: "text-[#73421f]",
  },
  gem: {
    barPath: "CountBar/Gem_CountBar.png",
    iconPath: "Icons/Gem_Icon.png",
    textClassName: "text-[#73421f]",
  },
} as const;

export function AssetCounter({
  className,
  label,
  value,
  variant,
}: {
  className?: string;
  label?: string;
  value: string | number;
  variant: keyof typeof counterSkins;
}) {
  const counterConfig = counterSkins[variant];

  return (
    <div
      className={clsx("pixel-art inline-flex items-center gap-1.5 px-2 py-1.5", className)}
      style={{
        ...imageStyle(counterConfig.barPath),
        minWidth: 164,
        minHeight: 42,
      }}
    >
      <img
        src={`${UI_BASE}/${counterConfig.iconPath}`}
        alt=""
        aria-hidden="true"
        className="pixel-art h-6 w-6 shrink-0"
      />
      <div className="min-w-0 drop-shadow-[0_1px_0_rgba(28,16,44,0.85)]">
        {label ? (
          <div className="font-game-ui text-[9px] uppercase leading-none tracking-[0.08em] text-[#ffe5a0]">
            {label}
          </div>
        ) : null}
        <div className={clsx("font-game-display-tight text-[14px] leading-none text-[#fff8de]", counterConfig.textClassName)}>
          {value}
        </div>
      </div>
    </div>
  );
}
