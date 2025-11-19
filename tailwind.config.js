/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        physio: {
          bg: {
            core: "#030712", // Deepest Black/Blue
            surface: "#111827", // Card Background
            highlight: "#1f2937", // Hover State
            glass: "rgba(17, 24, 39, 0.7)",
          },
          text: {
            primary: "#f9fafb", // High Emphasis
            secondary: "#9ca3af", // Medium Emphasis
            tertiary: "#6b7280", // Low Emphasis (NEW - Essential for labels)
            muted: "#4b5563",
            inverse: "#030712",
          },
          accent: {
            primary: "#6366f1", // Indigo
            secondary: "#8b5cf6", // Violet
            success: "#10b981", // Emerald
            warning: "#f59e0b", // Amber
            critical: "#ef4444", // Red
            cyan: "#06b6d4", // Cyan (Good for "Information")
            mint: "#34d399", // Mint (Good for "Safe")
          },
          border: {
            subtle: "rgba(255, 255, 255, 0.08)", // Slightly lighter for visibility
            strong: "rgba(255, 255, 255, 0.15)",
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
