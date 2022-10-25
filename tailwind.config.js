/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        spectral: "Spectral",
        "spectral-sc": "Spectral SC",
        sans: "Inter, Arial, sans-serif",
      },
    },
  },
  plugins: [],
};
