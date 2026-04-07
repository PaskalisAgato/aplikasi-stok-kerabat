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
        "app": "var(--bg-app)",
        "background-app": "var(--bg-app)",
        "surface": "var(--bg-surface)",
        "main": "var(--text-main)",
        "muted": "var(--text-muted)",
        "border-dim": "var(--border-dim)",
        "success": "var(--success)",
        "danger": "var(--danger)",
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
