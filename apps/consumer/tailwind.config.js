/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // NOSH brand palette
        primary: "#D4654A",       // Warm terracotta — CTAs, active states
        secondary: "#2C3E2D",     // Deep forest — text, headers
        background: "#FBF8F4",    // Warm cream — feed background
        card: "#FFFFFF",
        wine: "#4A1528",          // Deep burgundy — wine card accents
        cocktail: "#1A3A4A",      // Deep teal — cocktail card accents
        alert: "#E8A93E",         // Warm amber — expiry alerts
        success: "#4CAF50",       // Green — pantry match badge
        muted: "#A0ACA3",        // Muted text
        "text-primary": "#2C3E2D",
        "text-secondary": "#6B7B6E",
        "text-muted": "#A0ACA3",
      },
      fontFamily: {
        heading: ["Fraunces"],
        body: ["Inter"],
        mono: ["JetBrains Mono"],
      },
      borderRadius: {
        card: "16px",
        button: "12px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
