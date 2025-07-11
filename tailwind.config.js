/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom theme colors
        'theme-green': '#6AC8A3',
        'theme-teal': '#76C0C8',
        'theme-blue': '#81CFEA',
        'theme-green-dark': '#5BB394',
        'theme-teal-dark': '#67B1B9',
        'theme-blue-dark': '#72C0DB',
        gray: {
          750: '#374151',
          850: '#1F2937',
          950: '#111827',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-soft': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      boxShadow: {
        'theme': '0 10px 25px -3px rgba(106, 200, 163, 0.1), 0 4px 6px -2px rgba(106, 200, 163, 0.05)',
        'theme-lg': '0 20px 25px -5px rgba(106, 200, 163, 0.1), 0 10px 10px -5px rgba(106, 200, 163, 0.04)',
        'theme-xl': '0 25px 50px -12px rgba(106, 200, 163, 0.25)',
      }
    },
  },
  plugins: [],
};