/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'sans-serif']
      },
      colors: {
        gta: {
          darkCanvas: '#0b0c10',
          darkSurface: '#12151e',
          darkCard: '#151926',
          darkBorder: 'rgba(255, 255, 255, 0.08)',
          lightCanvas: '#f4f6fa',
          lightCard: '#ffffff',
          lightBorder: 'rgba(0, 0, 0, 0.08)',
          green: '#10b981',
          greenNeon: '#34d399',
          greenDark: '#064e3b',
          magenta: '#ec4899',
          magentaNeon: '#f43f5e',
          magentaDark: '#831843',
          violet: '#8b5cf6',
          cyan: '#06b6d4',
          amber: '#f59e0b'
        }
      },
      boxShadow: {
        'neon-green': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'neon-magenta': '0 0 20px -3px rgba(236, 72, 153, 0.35)',
        'neon-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
