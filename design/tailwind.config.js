/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wgold: '#EAB308',
        wblack: '#000000',
      }
    },
  },
  plugins: [],
}
