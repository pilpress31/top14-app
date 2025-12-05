/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rugby-blue': '#002244',
        'rugby-orange': '#FF6B35',
      },
    },
  },
  plugins: [],
}
