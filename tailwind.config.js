/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#1f1b16',
        cloth: { 50: '#faf6f0', 100: '#f3ebdd', 200: '#e6d7bd', 300: '#d3bc93' },
        indigo2: { 500: '#3b4a8c', 600: '#2f3b72', 700: '#242d58' },
        terra: { 400: '#d9825b', 500: '#c4663d', 600: '#a8512e' },
        pastel: { mint: '#f3ebdd', pink: '#f4d9cc', lilac: '#dcdff0', sun: '#f3e3b8', sky: '#d5deef' },
        moss: { 100: '#e1ead8', 500: '#5d7a49', 700: '#3f5631' },
      },
    },
  },
  plugins: [],
}
