/** @type {import('tailwindcss').Config} */
// Terrarium tokens. See docs/Terrarium-Brand-Guideline.pdf (colour, type, motion).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter for plain interface text; Fraunces for display; Unbounded for labels; IBM Plex Mono for data.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        wide: ['Unbounded', '"Arial Black"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#1f1b16',
        cloth: { 50: '#faf6f0', 100: '#f3ebdd', 200: '#e6d7bd', 300: '#d3bc93' },
        indigo2: { 500: '#3b4a8c', 600: '#2f3b72', 700: '#242d58' },
        terra: { 400: '#d9825b', 500: '#c4663d', 600: '#a8512e' },
        // Moss means one thing: a need has been met.
        moss: { 100: '#e1ead8', 300: '#a3c08c', 500: '#5d7a49', 700: '#3f5631' },
        pastel: { mint: '#f3ebdd', pink: '#f4d9cc', lilac: '#dcdff0', sun: '#f3e3b8', sky: '#d5deef' },
      },
      transitionDuration: { 377: '377ms', 610: '610ms', 987: '987ms' },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        grow: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        enter: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        grow: { from: { opacity: '0', transform: 'scale(0.4)' }, to: { opacity: '1', transform: 'none' } },
        extend: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        draw: { from: { strokeDashoffset: '1' }, to: { strokeDashoffset: '0' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        route: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        enter: 'enter 987ms cubic-bezier(0.4, 0, 0.2, 1) both',
        grow: 'grow 610ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        extend: 'extend 610ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        draw: 'draw 610ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        fade: 'fade 377ms cubic-bezier(0.4, 0, 0.2, 1) both',
        route: 'route 377ms cubic-bezier(0.4, 0, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
