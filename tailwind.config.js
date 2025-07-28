// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ... existing colors
      },
      animation: {
        // ... existing animations
      },
      keyframes: {
        // ... existing keyframes
      },
      boxShadow: {
        // ... existing box shadows
      },
      gridTemplateColumns: {
        // ... existing grid templates
        // NEW: Custom grid for compact invoice item rows (Item Name, Qty, Rate, Disc %, Tax %, Gross Amt, Net Amt, Delete Icon)
        'invoice-item-row-compact-v2': '2fr 0.5fr 0.5fr 0.5fr 0.5fr 1fr 1fr 0.2fr',
      }
    },
  },
  plugins: [],
};
