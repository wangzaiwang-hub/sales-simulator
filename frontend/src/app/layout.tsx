import type { Metadata } from "next";
import "./globals.css";
import MobileLandscapeGate from "./mobile-landscape-gate";

export const metadata: Metadata = {
  title: "销售模拟器",
  description: "一个有趣的2D销售模拟游戏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
        <MobileLandscapeGate />
      </body>
    </html>
  );
}
