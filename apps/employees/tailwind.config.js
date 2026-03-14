/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", "../shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "var(--primary)",
        "background-app": "var(--bg-app)",
        "surface": "var(--bg-surface)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        "border-dim": "var(--border-dim)",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}



