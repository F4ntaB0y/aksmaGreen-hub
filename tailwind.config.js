/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#030805',
          900: '#060e09',
          850: '#0a140e',
          800: '#0d1e14',
          700: '#112318',
        },
        emerald: {
          subtle: 'rgba(16, 185, 129, 0.08)',
          glow: 'rgba(16, 185, 129, 0.45)',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-lg': '0 0 45px rgba(16, 185, 129, 0.45)',
        glass: '0 20px 50px rgba(0, 0, 0, 0.85)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
