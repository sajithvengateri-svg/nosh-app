/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ChefOS Pro palette — kept for reference but ThemeProvider.tsx is source of truth
        chefos: {
          primary: "#6366F1",
          dark: "#1A1A2E",
          accent: "#818CF8",
        },
        // HomeChef palette — kept for reference but ThemeProvider.tsx is source of truth
        homechef: {
          primary: "#EA580C",
          light: "#FFF7ED",
          accent: "#FB923C",
        },
      },
    },
  },
  plugins: [],
};
