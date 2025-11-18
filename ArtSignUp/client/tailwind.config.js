/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        highcruiser: ['HighCruiser', 'sans-serif'], // Your custom font
        albert: ['Albert', 'sans-serif'], // Your custom font
        akshar: ['Akshar', 'sans-serif'], // Your custom font
      },
    },
  },
  plugins: [],
}
