/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'highcruiser': ['HighCruiser', 'cursive'],
        'akshar': ['Akshar', 'sans-serif'],
        'albert': ['AlbertSans', 'sans-serif'],

        'sans': ['AlbertSans', 'ui-sans-serif', 'system-ui'],
        'display': ['HighCruiser', 'cursive'],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      }
    },
  },
  plugins: [],
}

