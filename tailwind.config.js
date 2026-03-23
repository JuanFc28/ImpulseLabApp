/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí le decimos a Tailwind dónde buscar tus clases
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Colores personalizados de Impulse Lab
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