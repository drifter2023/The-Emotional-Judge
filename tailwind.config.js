/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'judge': {
          dark: '#0f172a',
          darker: '#020617',
          gold: '#d4a843',
          'gold-light': '#f0d78c',
        },
        'verdict': {
          green: '#22c55e',
          yellow: '#eab308',
          orange: '#f97316',
          red: '#ef4444',
          'dark-red': '#991b1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'needle-swing': 'needleSwing 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        needleSwing: {
          '0%, 100%': { transform: 'rotate(-30deg)' },
          '50%': { transform: 'rotate(30deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 168, 67, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 168, 67, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
