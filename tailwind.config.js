/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Surface tokens — used across chrome/UI (not the A4 paper)
                surface: {
                    light: '#f8fafc',  // slate-50
                    DEFAULT: '#ffffff',
                    dark: '#0f172a',   // slate-900
                    darker: '#020617', // slate-950
                },
            },
        },
    },
    plugins: [],
}
