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
                // Editorial Bold palette (chrome of the app — not the A4 paper)
                ink: { DEFAULT: '#16130f', soft: '#26211a' },
                accent: { DEFAULT: '#ff4d2e', press: '#e63c1f' },
                canvas: { DEFAULT: '#f6f3ec', 2: '#efe9df', 3: '#e7e0d3' },
                paper: { DEFAULT: '#ffffff', 2: '#f1ebe0' },
                line: { DEFAULT: '#e7dfd0', 2: '#e2dacb', dotted: '#b8af9c' },
                // Surface tokens — kept for any existing references
                surface: {
                    light: '#f8fafc',
                    DEFAULT: '#ffffff',
                    dark: '#0f172a',
                    darker: '#020617',
                },
            },
            fontFamily: {
                display: ['Sora', 'sans-serif'],
                thai: ['"IBM Plex Sans Thai"', 'Sora', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
