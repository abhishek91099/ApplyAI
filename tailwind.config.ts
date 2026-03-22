import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        base: "var(--apple-bg)",
        surface: "var(--apple-elevated)",
        elevated: "var(--apple-elevated-2)",
        muted: "var(--apple-text-dim)",
        brand: {
          DEFAULT: "var(--apple-blue)",
          400: "var(--apple-blue)",
          500: "var(--apple-blue-hover)",
        },
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(180deg, var(--apple-blue) 0%, var(--apple-blue-hover) 100%)",
        "gradient-warm":
          "linear-gradient(135deg, rgba(255,149,0,0.9) 0%, rgba(255,59,48,0.85) 100%)",
        "gradient-success": "linear-gradient(180deg, #30d158 0%, #28a745 100%)",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0,0,0,0.45)",
        card: "0 2px 16px rgba(0,0,0,0.35)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.06)",
        "glow-brand": "0 0 0 1px rgba(41,151,255,0.2), 0 8px 32px rgba(41,151,255,0.15)",
        "apple-hero": "0 40px 100px -40px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
};

export default config;
