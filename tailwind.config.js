/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // physioLab Design System
        physio: {
          bg: {
            core: '#101218',
            edge: '#161925',
            secondary: '#1C2430',
            tertiary: '#21293F',
            border: '#2D3748',
          },
          text: {
            primary: '#F5F7FF',
            secondary: '#A6AECF',
            tertiary: '#5A6385',
          },
          accent: {
            cyan: '#4BBBF7',
            violet: '#9B6CFF',
            mint: '#45E2AB',
          },
          tier: {
            1: '#45E2AB',
            2: '#4BBBF7',
            3: '#F59E0B',
            4: '#F85149',
          },
          success: '#45E2AB',
          warning: '#F59E0B',
          error: '#F85149',
          info: '#4BBBF7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      boxShadow: {
        'physio-subtle': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'physio-medium': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'physio-elevated': '0 10px 15px rgba(0, 0, 0, 0.5)',
        'physio-glow-cyan': '0 0 32px rgba(75, 187, 247, 0.35)',
      },
      transitionDuration: {
        'fast': '100ms',
        'standard': '200ms',
        'slow': '400ms',
      },
    },
  },
  plugins: [],
}

