/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: {
          950: '#050b14',
          900: '#081221',
          850: '#0a1729',
          800: '#0d1e33',
          700: '#122a44',
          600: '#1a3a5c',
        },
        signal: {
          400: '#5eead4',
          500: '#2dd4bf',
          600: '#14b8a6',
        },
        risk: {
          high: '#f87171',
          medium: '#fbbf24',
          low: '#4ade80',
        },
      },
      fontFamily: {
        display: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'sonar-grid':
          'linear-gradient(rgba(94,234,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
      keyframes: {
        sweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        sweep: 'sweep 4s linear infinite',
        pulseRing: 'pulseRing 2.2s ease-out infinite',
      },
    },
  },
  plugins: [],
}
