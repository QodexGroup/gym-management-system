/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Themeable palettes — values come from CSS variables defined in
        // src/shared/styles/_theme.scss and swapped at runtime by ThemeContext.
        // Variables hold space-separated RGB triplets, e.g. "14 165 233".
        primary: {
          50: 'rgb(var(--c-primary-50) / <alpha-value>)',
          100: 'rgb(var(--c-primary-100) / <alpha-value>)',
          200: 'rgb(var(--c-primary-200) / <alpha-value>)',
          300: 'rgb(var(--c-primary-300) / <alpha-value>)',
          400: 'rgb(var(--c-primary-400) / <alpha-value>)',
          500: 'rgb(var(--c-primary-500) / <alpha-value>)',
          600: 'rgb(var(--c-primary-600) / <alpha-value>)',
          700: 'rgb(var(--c-primary-700) / <alpha-value>)',
          800: 'rgb(var(--c-primary-800) / <alpha-value>)',
          900: 'rgb(var(--c-primary-900) / <alpha-value>)',
        },
        secondary: {
          50: 'rgb(var(--c-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--c-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--c-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--c-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--c-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--c-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--c-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--c-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--c-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--c-secondary-900) / <alpha-value>)',
        },
        // App shell (sidebar + navbar + footer) — themed, mode-independent.
        chrome: {
          DEFAULT: 'rgb(var(--c-chrome-bg) / <alpha-value>)',
          bg: 'rgb(var(--c-chrome-bg) / <alpha-value>)',
          elevated: 'rgb(var(--c-chrome-elevated) / <alpha-value>)',
          border: 'rgb(var(--c-chrome-border) / <alpha-value>)',
          hover: 'rgb(var(--c-chrome-hover) / <alpha-value>)',
          active: 'rgb(var(--c-chrome-active) / <alpha-value>)',
          text: 'rgb(var(--c-chrome-text) / <alpha-value>)',
          muted: 'rgb(var(--c-chrome-muted) / <alpha-value>)',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Neutral/surface scale — used semantically (900 = app background,
        // 800 = cards/sidebar, 700 = borders, 400 = muted text, 50 = strongest
        // text). In light mode _theme.scss inverts these so the same classes
        // render correctly without touching any component.
        dark: {
          50: 'rgb(var(--c-surface-50) / <alpha-value>)',
          100: 'rgb(var(--c-surface-100) / <alpha-value>)',
          200: 'rgb(var(--c-surface-200) / <alpha-value>)',
          300: 'rgb(var(--c-surface-300) / <alpha-value>)',
          400: 'rgb(var(--c-surface-400) / <alpha-value>)',
          500: 'rgb(var(--c-surface-500) / <alpha-value>)',
          600: 'rgb(var(--c-surface-600) / <alpha-value>)',
          700: 'rgb(var(--c-surface-700) / <alpha-value>)',
          800: 'rgb(var(--c-surface-800) / <alpha-value>)',
          900: 'rgb(var(--c-surface-900) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['var(--font-app)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
      }
    },
  },
  plugins: [],
}
