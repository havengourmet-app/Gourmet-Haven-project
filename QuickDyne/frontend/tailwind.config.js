/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#01de1a",
          greenDeep: "#00b514",
          dark: "#0f1115",
          darkSoft: "#15181e",
          light: "#f8f9fa",
          ink: "#1a1a1a"
        }
      },
      boxShadow: {
        soft: "0 24px 80px rgba(15, 23, 42, 0.16)",
        card: "0 8px 24px rgba(0, 0, 0, 0.08)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(1,222,26,0.18), transparent 35%), radial-gradient(circle at bottom right, rgba(1,222,26,0.1), transparent 30%)"
      }
    }
  },
  plugins: []
};
