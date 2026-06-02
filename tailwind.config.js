/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fdf4e7',
          100: '#fae4c2',
          200: '#f5c878',
          300: '#f0a830',
          400: '#e88c10',
          500: '#d4740a',
          600: '#b05c07',
          700: '#8a4505',
          800: '#6b3304',
          900: '#4a2202',
        },
        surface: {
          DEFAULT: '#0f0d0b',
          50: '#1c1812',
          100: '#252018',
          200: '#2f2820',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-10px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
