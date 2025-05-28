/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
      },
      colors: {
        'gray': {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          400: '#9CA3AF',
          200: '#E5E7EB',
        },
        'purple': {
          400: '#A855F7',
        }
      },
    },
  },
  plugins: [],
} 