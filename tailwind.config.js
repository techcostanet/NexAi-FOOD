/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f6f8f2',
          100: '#eaf0e2',
          200: '#d4e1c5',
          300: '#b4cb9d',
          400: '#8fad72',
          500: '#6b8e23', // Primary Olive Green
          600: '#556b2f', // Darker Olive Green
          700: '#415224',
          800: '#34411f',
          900: '#2c371d',
          950: '#171e0e',
        },
        terracotta: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c', // Terracotta orange
          700: '#c2410c', // Terracotta red-orange
          800: '#9a3412',
          900: '#7c2d12',
        },
        offwhite: {
          DEFAULT: '#fcfbf9',
          card: '#ffffff',
          sidebar: '#f7f6f2',
          border: '#e7e5e0',
          hover: '#f2f0ea',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
