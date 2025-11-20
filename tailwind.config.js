/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        physio: {
          bg: {
            core: "#09090B", // Level 0 — Void
            surface: "#18181B", // Level 1 — Sidebars
            highlight: "#27272A", // Level 2 — Panels/Cards
            input: "#3F3F46", // Level 3 — Controls
            glass: "rgba(24, 24, 27, 0.85)",
          },
          text: {
            primary: "#E4E4E7",
            secondary: "#A1A1AA",
            tertiary: "#71717A",
            muted: "#52525B",
            inverse: "#09090B",
          },
          accent: {
            primary: "#3B82F6", // Tech Blue
            secondary: "#F8FAFC", // Titanium White
            success: "#22C55E",
            warning: "#FBBF24",
            critical: "#F87171",
            cyan: "#38BDF8",
            mint: "#A5F3FC",
          },
          border: {
            subtle: "#27272A",
            strong: "#3F3F46",
          },
        },
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"], // Added Outfit preference
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "neo-sm": "0 2px 4px rgba(0, 0, 0, 0.3)",
        "neo-md": "0 8px 16px rgba(0, 0, 0, 0.4)",
        "neo-lg": "0 16px 32px rgba(0, 0, 0, 0.5)",
        "neo-glow": "0 0 20px rgba(99, 102, 241, 0.15)",
        "physio-subtle": "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
        "physio-elevated": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #6366f1, #8b5cf6)",
        "gradient-safe": "linear-gradient(to right, #10b981, #34d399)",
        "gradient-danger": "linear-gradient(to right, #ef4444, #f87171)",
      },
    },
  },
  plugins: [],
};
