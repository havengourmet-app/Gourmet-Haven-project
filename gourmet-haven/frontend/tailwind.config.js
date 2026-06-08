/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary green — deep, food-friendly, professional
          DEFAULT: "#16a34a",
          light: "#22c55e",
          lighter: "#bbf7d0",
          lightest: "#f0fdf4",
          dark: "#15803d",
          darker: "#14532d",

          // Warm neutrals — replaces flat grey
          surface: "#fafaf8",
          card: "#ffffff",
          muted: "#f5f4f0",
          border: "#e8e6e0",
          borderHover: "#c9c6bd",

          // Text scale
          ink: "#1c1917",
          inkSecondary: "#57534e",
          inkMuted: "#a8a29e",

          // Accent — warm amber for CTAs / highlights
          amber: "#d97706",
          amberLight: "#fef3c7",

          // Status
          danger: "#dc2626",
          dangerLight: "#fef2f2",
          success: "#16a34a",
          successLight: "#f0fdf4",
          warning: "#d97706",
          warningLight: "#fffbeb"
        }
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },
      boxShadow: {
        // Layered shadow system for depth
        xs: "0 1px 2px 0 rgba(28, 25, 23, 0.04)",
        sm: "0 1px 3px 0 rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.04)",
        md: "0 4px 6px -1px rgba(28, 25, 23, 0.07), 0 2px 4px -2px rgba(28, 25, 23, 0.05)",
        lg: "0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.04)",
        card: "0 1px 3px 0 rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.04)",
        "card-hover": "0 4px 12px -2px rgba(28, 25, 23, 0.10), 0 2px 4px -2px rgba(28, 25, 23, 0.06)",
        "card-lifted": "0 8px 24px -4px rgba(28, 25, 23, 0.12), 0 4px 8px -4px rgba(28, 25, 23, 0.06)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)",
        "warm-gradient": "linear-gradient(135deg, #fafaf8 0%, #f0fdf4 100%)",
        "hero-mesh": "radial-gradient(at 20% 80%, rgba(22, 163, 74, 0.12) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(21, 128, 61, 0.08) 0px, transparent 50%)"
      }
    }
  },
  plugins: []
};