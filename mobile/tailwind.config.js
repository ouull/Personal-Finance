/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['14px', '20px'],
        'sm': ['16px', '24px'],
        'base': ['18px', '26px'],
        'lg': ['20px', '28px'],
        'xl': ['24px', '32px'],
        '2xl': ['28px', '36px'],
        '3xl': ['34px', '42px'],
        '4xl': ['40px', '48px'],
      },
      colors: {
        'theme-bg': '#FDF8EB',
        'theme-card': '#FFFFFF',
        'theme-input': '#EAE5D9',
        'theme-border': '#E5E0D5',
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}
