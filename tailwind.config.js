/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: '#F5F7FA',
          dark: '#1A1F2E',
        },
        foreground: {
          DEFAULT: '#1A1F2E',
          dark: '#F5F7FA',
        },
        primary: {
          DEFAULT: '#7C9CB4',
          dark: '#5A7A94',
        },
        secondary: {
          DEFAULT: '#A8C6B4',
          dark: '#7A9A86',
        },
        accent: {
          DEFAULT: '#E2D7F0',
          dark: '#C2B7D0',
        },
      },
      boxShadow: {
        'calm': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      transitionDuration: {
        'calm': '300ms',
      },
    },
  },
  plugins: [],
} 