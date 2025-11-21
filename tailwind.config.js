/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        main: "#0B0C0E",
        surface: "#13151A",
        element: "#1F2229",
        primary: "#EDEDED",
        secondary: "#8A8F98",
        tertiary: "#575C66",
        indigo: {
          DEFAULT: "#5E6AD2",
          glow: "rgba(94, 106, 210, 0.5)",
        },
        emerald: {
          DEFAULT: "#27D796",
          dim: "rgba(39, 215, 150, 0.1)",
        },
        rose: {
          DEFAULT: "#E05555",
          dim: "rgba(224, 85, 85, 0.1)",
        },
        // Physio design system colors
        physio: {
          // Background colors
          'bg-core': 'var(--bg-main)',
          'bg-void': 'var(--bg-main)',
          'bg-surface': 'var(--bg-surface)',
          'bg-panel': 'var(--bg-surface)',
          'bg-input': 'var(--color-bg-input)',
          'bg-highlight': 'var(--bg-surface-hover)',
          'bg-console': 'var(--color-bg-console)',

          // Text colors
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-tertiary': 'var(--color-text-tertiary)',
          'text-muted': 'var(--color-text-muted)',

          // Accent colors
          'accent-primary': 'var(--color-accent-primary)',
          'accent-secondary': 'var(--color-accent-secondary)',
          'accent-success': 'var(--color-accent-success)',
          'accent-warning': 'var(--color-accent-warning)',
          'accent-critical': 'var(--color-accent-critical)',
          'accent-cyan': 'var(--primary-indigo)',

          // Border colors
          'border-subtle': 'var(--color-border-subtle)',
          'border-strong': 'var(--color-border-strong)',
          'border-accent': 'var(--color-border-accent)',
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "monospace"],
      },
      boxShadow: {
        "glow-indigo": "0 0 20px -5px rgba(94, 106, 210, 0.5)",
        "glow-red": "0 0 20px -5px rgba(224, 85, 85, 0.5)",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
      },
      keyframes: {
        "fade-in": {
          "from": { opacity: "0", transform: "translateY(5px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "from": { transform: "translateX(-100%)" },
          "to": { transform: "translateX(0)" },
        },
        "slide-in-right": {
          "from": { transform: "translateX(100%)" },
          "to": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
