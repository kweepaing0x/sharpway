/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'theme': {
          'primary': 'rgb(var(--color-bg-primary))',
          'secondary': 'rgb(var(--color-bg-secondary))',
          'tertiary': 'rgb(var(--color-bg-tertiary))',
          'card': 'rgb(var(--color-card-bg))',
          'input': 'rgb(var(--color-input-bg))',
          'header': 'rgb(var(--color-header-bg))',
        },
        'text-theme': {
          'primary': 'rgb(var(--color-text-primary))',
          'secondary': 'rgb(var(--color-text-secondary))',
          'tertiary': 'rgb(var(--color-text-tertiary))',
          'header': 'rgb(var(--color-header-text))',
        },
        'border-theme': 'rgb(var(--color-border))',
      }
    },
  },
  plugins: [],
};
