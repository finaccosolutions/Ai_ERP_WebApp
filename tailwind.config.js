/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // New Emerald Glow palette
        'emerald-50': '#ECFDF5',
        'emerald-100': '#D1FAE5',
        'emerald-200': '#A7F3D0',
        'emerald-300': '#6EE7B7',
        'emerald-400': '#34D399', // Core vibrant green
        'emerald-500': '#10B981',
        'emerald-600': '#059669',
        'emerald-700': '#047857',
        'emerald-800': '#065F46',
        'emerald-900': '#064E3B',
        'emerald-950': '#022C22',
        // Complementary Sky Blue palette
        'sky-50': '#F0F9FF',
        'sky-100': '#E0F2FE',
        'sky-200': '#BAE6FD',
        'sky-300': '#7DD3FC',
        'sky-400': '#38BFF8',
        'sky-500': '#0EA5E9',
        'sky-600': '#0284C7',
        'sky-700': '#0369A1',
        'sky-800': '#075985',
        'sky-900': '#0C4A6E',
        'sky-950': '#082F49',
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
        // Updated shadows to use the new emerald-400 base
        'theme': '0 10px 25px -3px rgba(52, 211, 153, 0.1), 0 4px 6px -2px rgba(52, 211, 153, 0.05)',
        'theme-lg': '0 20px 25px -5px rgba(52, 211, 153, 0.1), 0 10px 10px -5px rgba(52, 211, 153, 0.04)',
        'theme-xl': '0 25px 50px -12px rgba(52, 211, 153, 0.25)',
      }
    },
  },
  plugins: [],
};