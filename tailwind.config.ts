import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#150f1e',
          soft: '#1e1529',
          lift: '#2a1d38',
        },
        cream: '#fff4e2',
        honey: {
          DEFAULT: '#ffbb38',
          deep: '#f59300',
        },
        coral: {
          DEFAULT: '#ff6b6b',
          deep: '#e03e5c',
        },
        mint: {
          DEFAULT: '#4fd6a0',
          deep: '#17a97a',
        },
        grape: {
          DEFAULT: '#a878ff',
          deep: '#6d3fd6',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.375rem',
      },
      boxShadow: {
        key: '0 4px 0 0 rgba(0,0,0,0.35)',
        'key-sm': '0 3px 0 0 rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(255,187,56,0.35), 0 8px 30px -8px rgba(255,187,56,0.55)',
        panel: '0 24px 60px -24px rgba(0,0,0,0.85)',
      },
      keyframes: {
        'aurora-drift': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%,-6%,0) scale(1.12)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(7px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(255,187,56,0.5)' },
          '70%': { boxShadow: '0 0 0 12px rgba(255,187,56,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,187,56,0)' },
        },
      },
      animation: {
        'aurora-drift': 'aurora-drift 18s ease-in-out infinite',
        shake: 'shake 0.45s cubic-bezier(.36,.07,.19,.97)',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
