/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neo-Lab Design System
        physio: {
          bg: {
            core: "#030712", // Gray-950 (Canvas)
            surface: "#111827", // Gray-900 (Cards)
            highlight: "#1f2937", // Gray-800 (Hover)
            glass: "rgba(17, 24, 39, 0.7)",
          },
          text: {
            primary: "#f9fafb", // Gray-50
            secondary: "#9ca3af", // Gray-400
            muted: "#4b5563", // Gray-600
            inverse: "#030712", // Gray-950
          },
          accent: {
            primary: "#6366f1", // Indigo-500 (Action)
            secondary: "#8b5cf6", // Violet-500 (Data)
            success: "#10b981", // Emerald-500
            warning: "#f59e0b", // Amber-500
            critical: "#ef4444", // Red-500
          },
          border: {
            subtle: "rgba(255, 255, 255, 0.05)",
            strong: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "neo-sm": "0 2px 4px rgba(0, 0, 0, 0.3)",
        "neo-md": "0 8px 16px rgba(0, 0, 0, 0.4)",
        "neo-lg": "0 16px 32px rgba(0, 0, 0, 0.5)",
        "neo-glow": "0 0 20px rgba(99, 102, 241, 0.3)", // Indigo glow
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #6366f1, #8b5cf6)",
      },
    },
  },
  plugins: [],
};
