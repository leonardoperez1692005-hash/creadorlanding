/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                'sl-bg': '#0A0E1A',
                'sl-bg-alt': '#111827',
                'sl-cyan': '#00F0FF',
                'sl-magenta': '#FF007F',
                'sl-accent': '#7B61FF',
                'sl-border': 'rgba(255,255,255,0.1)',
                'sl-text': '#FFFFFF',
                'sl-text-muted': '#E0E0E0',
            },
            fontFamily: {
                heading: ['Rajdhani', 'sans-serif'],
                body: ['Montserrat', 'sans-serif'],
            },
            boxShadow: {
                'neon-cyan': '0 0 30px rgba(0, 240, 255, 0.3)',
                'neon-magenta': '0 0 30px rgba(255, 0, 127, 0.3)',
            },
        },
    },
    plugins: [],
};
