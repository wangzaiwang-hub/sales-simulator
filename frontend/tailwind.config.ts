import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-game-ui)", "Microsoft YaHei", "sans-serif"],
        pixel: ["Press Start 2P", "Courier New", "monospace"],
        "game-ui": ["var(--font-game-ui)", "Microsoft YaHei", "sans-serif"],
        "game-display": ["var(--font-game-display)", "Press Start 2P", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
