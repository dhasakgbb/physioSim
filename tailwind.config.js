/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        physio: {
          bg: {
            core: "#202124", // Google Dark Grey (Background)
            surface: "#2D2E31", // Surface (Panels)
            highlight: "#3C4043", // Hover / Selected
            glass: "rgba(32, 33, 36, 0.95)", // Solid, technical feel
          },
          text: {
            primary: "#E8EAED", // High Emphasis
            secondary: "#9AA0A6", // Medium Emphasis
            tertiary: "#5F6368", // Low Emphasis / Disabled
            muted: "#3C4043", // Borders / Dividers
            inverse: "#202124",
          },
          accent: {
            primary: "#8AB4F8", // Cornflower Blue (Anabolic/Primary Data)
            secondary: "#C58AF9", // Purple (Secondary Data)
            success: "#81C995", // Green (Safe)
            warning: "#FDD663", // Yellow (Warning)
            critical: "#F28B82", // Light Red (Danger/Risk)
            cyan: "#78D9EC", // Cyan (Info)
            mint: "#81C995", // Mint
          },
          border: {
            subtle: "#3C4043", // Divider
            strong: "#5F6368", // Input Border
          },
        },
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"], // Roboto is king for Google style
        mono: ["Roboto Mono", "Menlo", "monospace"], // Technical font
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px', // Max rounding for this aesthetic
      },
      boxShadow: {
        "neo-sm": "0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)",
        "neo-md": "0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)",
        "physio-subtle": "0 1px 2px 0 rgba(0,0,0,0.3)",
        "physio-elevated": "0 4px 8px 3px rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #8AB4F8, #C58AF9)",
        "gradient-safe": "linear-gradient(to right, #81C995, #A5D6A7)",
        "gradient-danger": "linear-gradient(to right, #F28B82, #EF9A9A)",
      },
    },
  },
  plugins: [],
};
