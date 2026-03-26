import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          raised: 'var(--color-bg-surface-raised)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          amber: 'var(--color-accent-amber)',
          cyan: 'var(--color-accent-cyan)',
        },
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
      },
    },
  },
  plugins: [],
} satisfies Config;
