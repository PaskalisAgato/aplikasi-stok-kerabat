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
        "primary": "var(--primary)",
        "background-app": "var(--bg-app)",
        "surface": "var(--bg-surface)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        "border-dim": "var(--border-dim)",
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
