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
        cloth: { 50: '#ffffff', 100: '#f5f5f5', 200: '#e6e6e6', 300: '#cccccc' },
        indigo2: { 500: '#04a964', 600: '#027e4a', 700: '#01623a' },
        terra: { 400: '#f08ab0', 500: '#d6336c', 600: '#b02458' },
        pastel: { mint: '#d8f4e6', pink: '#ffe0ea', lilac: '#e7e0ff', sun: '#fff0b8', sky: '#d9ecff' },
        moss: { 100: '#e1ead8', 500: '#5d7a49', 700: '#3f5631' },
      },
    },
  },
  plugins: [],
}
