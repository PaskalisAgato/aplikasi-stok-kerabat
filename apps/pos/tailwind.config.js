/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#8B4513',
                    light: '#D2691E',
                    dark: '#5D2E0B',
                },
                background: {
                    light: '#FFFFFF',
                    dark: '#0f172a',
                }
            },
            fontFamily: {
                display: ['"Plus Jakarta Sans"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
