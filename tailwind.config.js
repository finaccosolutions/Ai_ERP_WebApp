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
        // Additional color palettes for variety
        'purple-50': '#F5F3FF',
        'purple-100': '#EDE9FE',
        'purple-200': '#DDD6FE',
        'purple-300': '#C4B5FD',
        'purple-400': '#A78BFA',
        'purple-500': '#8B5CF6',
        'purple-600': '#7C3AED',
        'purple-700': '#6D28D9',
        'purple-800': '#5B21B6',
        'purple-900': '#4C1D95',
        'purple-950': '#2E1065',
        'orange-50': '#FFF7ED',
        'orange-100': '#FFEDD5',
        'orange-200': '#FEE2E2', // Adjusted to be more distinct from yellow
        'orange-300': '#FDBA74',
        'orange-400': '#FB923C',
        'orange-500': '#F97316',
        'orange-600': '#EA580C',
        'orange-700': '#C2410C',
        'orange-800': '#9A3412',
        'orange-900': '#7C2D12',
        'orange-950': '#431407',
        'teal-50': '#F0FDFA',
        'teal-100': '#CCFBF1',
        'teal-200': '#99F6E4',
        'teal-300': '#5EEAD4',
        'teal-400': '#2DD4BF',
        'teal-500': '#14B8A6',
        'teal-600': '#0D9488',
        'teal-700': '#0F766E',
        'teal-800': '#115E59',
        'teal-900': '#134E4A',
        'teal-950': '#042F2E',
        'indigo-50': '#EEF2FF',
        'indigo-100': '#E0E7FF',
        'indigo-200': '#C7D2FE',
        'indigo-300': '#A5B4FC',
        'indigo-400': '#818CF8',
        'indigo-500': '#6366F1',
        'indigo-600': '#4F46E5',
        'indigo-700': '#4338CA',
        'indigo-800': '#3730A3',
        'indigo-900': '#312E81',
        'indigo-950': '#1E1B4B',
        'pink-50': '#FDF2F8',
        'pink-100': '#FCE7F3',
        'pink-200': '#FBCFE8',
        'pink-300': '#F9A8D4',
        'pink-400': '#F472B6',
        'pink-500': '#EC4899',
        'pink-600': '#DB2777',
        'pink-700': '#BE185D',
        'pink-800': '#9D174D',
        'pink-900': '#831843',
        'pink-950': '#500724',
        'red-50': '#FEF2F2',
        'red-100': '#FEE2E2',
        'red-200': '#FECACA',
        'red-300': '#FCA5A5',
        'red-400': '#F87171',
        'red-500': '#EF4444',
        'red-600': '#DC2626',
        'red-700': '#B91C1C',
        'red-800': '#991B1B',
        'red-900': '#7F1D1D',
        'red-950': '#450A0A',
        'yellow-50': '#FEFCE8',
        'yellow-100': '#FEF9C3',
        'yellow-200': '#FEF08A',
        'yellow-300': '#FDE047',
        'yellow-400': '#FACC15',
        'yellow-500': '#EAB308',
        'yellow-600': '#CA8A04',
        'yellow-700': '#A16207',
        'yellow-800': '#854D09',
        'yellow-900': '#713F12',
        'yellow-950': '#422006',
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
      },
      gridTemplateColumns: {
        // Reverted to original for now, will be removed if not needed
        'invoice-item-row': '2fr 0.7fr 0.7fr 0.7fr 0.7fr 1fr 0.2fr',
        'ledger-entry-row': '1.5fr 0.7fr 1.5fr 0.2fr',
        // NEW: Custom grid for invoice item rows
        'invoice-item-row-v2': '3fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 1fr 1fr 0.2fr', // ItemName, Qty, Unit, Rate, Discount, TaxRate, GrossAmount, NetAmount, Delete
      }
    },
  },
  plugins: [],
};