/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            950: '#070c19', // Pure deep contrast navy
            900: '#0b132b', // Deep navy background
            800: '#1c2541', // Card background dark
            700: '#3a506b', // Accent/border dark
            600: '#486581', // Muted text/icons
          },
          cyan: {
            DEFAULT: '#00f5ff', // Glow cyan
            500: '#00e1eb',
            400: '#33f7ff',
          },
          sky: {
            50: '#f4f8ff',
            100: '#eef5ff', // Crisp light background
            200: '#dce8f9',
            300: '#b9d2f6',
            400: '#8bafe9',
            900: '#0f2d59',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(0, 245, 255, 0.7)'
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '0.8',
            boxShadow: '0 0 12px 6px rgba(0, 245, 255, 0)'
          }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
