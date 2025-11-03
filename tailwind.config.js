/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        'custom-card': '0 6px 20px rgba(0, 0, 0, 0.50)',
      }
    },
  },
  plugins: [function ({ addUtilities }) {
    addUtilities({
      '.text-shadow-sm': { textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' },
      '.text-shadow-md': { textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' },
      '.text-shadow-lg': { textShadow: '2px 2px 1px rgba(0, 0, 0, 1)' },
      '.text-shadow-xl': { textShadow: '0 8px 16px rgba(0, 0, 0, 0.6)' },
      '.text-shadow-glow': { textShadow: '5px 5px 5px rgba(0, 0, 0, 1)' },
    });
  }],
};