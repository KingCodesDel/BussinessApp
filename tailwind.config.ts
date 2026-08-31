import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171A",
        porcelain: "#FAF7F2",
        evergreen: {
          DEFAULT: "#1F5C4E",
          50: "#EAF3F0",
          100: "#CFE4DD",
          400: "#2C7A67",
          500: "#1F5C4E",
          600: "#164A3F",
          700: "#0F372F",
        },
        gold: {
          DEFAULT: "#C7A24C",
          light: "#E4CD8C",
        },
        slate: {
          DEFAULT: "#6B7280",
          soft: "#9CA3AF",
        },
        line: "#E7E2D8",
        "line-dark": "#262B2E",
        surface: "#FFFFFF",
        "surface-dark": "#1B1F22",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,23,26,0.04), 0 8px 24px -12px rgba(20,23,26,0.12)",
        soft: "0 1px 3px rgba(20,23,26,0.06)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "seal-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "seal-spin": "seal-spin 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
