/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        impulse: {
          cyan: "#00E5FF",
          dark: "#0A0A0A",
          gray: "#111111",
          border: "#222222",
        },
      },
    },
  },
  plugins: [],
};