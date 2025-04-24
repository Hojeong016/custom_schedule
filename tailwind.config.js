/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brownPrimary: '#5a3d1e',
        brownSecondary: '#9f7150',
      },
      fontFamily: {
        cute: ['"Gowun Dodum"', 'sans-serif'],
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: 0.2, transform: 'scale(0.9)' },
          '50%': { opacity: 1, transform: 'scale(1.2)' },
        },
      },
      animation: {
        sparkle: 'sparkle 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
