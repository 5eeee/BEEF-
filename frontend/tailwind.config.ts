import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terracotta: { DEFAULT: "#C4674A", dark: "#A85538" },
        mustard: { DEFAULT: "#D4A03C", light: "#E8C06A" },
        cream: "#FAF8F5",
        ink: "#14110F",
        muted: "#6B6460",
        charcoal: "#12100E",
        ember: { DEFAULT: "#E85D04", light: "#F48C06" },
        bone: "#F7F3EE",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
