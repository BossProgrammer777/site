import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0d0b',
          900: '#0f1512',
          800: '#151d18',
          700: '#1d271f',
          600: '#2a3830',
        },
        brand: {
          DEFAULT: '#22e06b',
          400: '#4df58a',
          500: '#22e06b',
          600: '#12b855',
          700: '#0c8f42',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,224,107,0.25), 0 8px 30px -12px rgba(34,224,107,0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
