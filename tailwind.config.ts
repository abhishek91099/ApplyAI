import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#09090b",
        surface: "#131316",
        elevated: "#1a1a1f",
        muted: "#222228",
        "border-subtle": "rgba(255,255,255,0.06)",
        "border-bright": "rgba(255,255,255,0.1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
        "gradient-accent": "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
        "gradient-accent-bright":
          "linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)",
        "gradient-warm": "linear-gradient(135deg, #f59e0b, #f97316)",
        "gradient-success": "linear-gradient(135deg, #10b981, #14b8a6)",
        "gradient-mesh":
          "radial-gradient(at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(at 80% 40%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(at 40% 80%, rgba(59,130,246,0.06) 0%, transparent 50%)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(99, 102, 241, 0.2)",
        "glow-lg": "0 0 60px -10px rgba(99, 102, 241, 0.3)",
        "glow-accent":
          "0 0 0 1px rgba(129,140,248,0.12), 0 4px 24px -4px rgba(129,140,248,0.15)",
        soft: "0 2px 16px -2px rgba(0, 0, 0, 0.3)",
        card: "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px -4px rgba(0,0,0,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
