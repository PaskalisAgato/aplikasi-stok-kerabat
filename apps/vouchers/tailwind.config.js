/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        primary: {
          50: '#f8f8f8',
          100: '#e8e8e8',
          200: '#d3d3d3',
          300: '#b3b3b3',
          400: '#8e8e8e',
          500: '#707070',
          600: '#555555',
          700: '#404040',
          800: '#2a2a2a',
          900: '#1a1a1a',
          950: '#0a0a0a',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
