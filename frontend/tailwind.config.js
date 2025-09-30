/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hipaa-blue': '#1e40af',
        'hipaa-red': '#dc2626',
        'hipaa-green': '#059669',
      }
    },
  },
  plugins: [],
}
