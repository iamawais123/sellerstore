/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0a3d62',
        'brand-dark': '#0a1628',
        'brand-gold': '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(2rem)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'toast-in': { from: { transform: 'translateY(-0.5rem)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'sheet-up': 'sheet-up 0.2s ease-out',
        'toast-in': 'toast-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
