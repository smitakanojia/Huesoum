/** @type {import('tailwindcss').Config} */
// The design system lives in src/styles/app.css (ported from the prototype and
// keyed to CSS custom properties). Tailwind is available for utility tweaks and
// mirrors the same institutional tokens so the two never diverge.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        ink: 'var(--ink)',
        navy: 'var(--navy)',
        blue: 'var(--blue)',
        green: 'var(--green)',
        ochre: 'var(--ochre)',
        rule: 'var(--rule)',
      },
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
