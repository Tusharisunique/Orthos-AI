/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'orthos-brown': {
          100: '#f5f0eb',
          200: '#e6d7c3',
          300: '#d7be9b',
          400: '#c8a574',
          500: '#b98c4c',
          600: '#94703d',
          700: '#6f542e',
          800: '#4a381e',
          900: '#251c0f',
        },
        'orthos-black': '#121212',
        'orthos-white': '#f8f8f8',
      },
      fontFamily: {
        'delius': ['Delius', 'cursive'],
      },
    },
  },
  plugins: [],
}