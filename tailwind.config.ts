import type { Config } from "tailwindcss";

/**
 * The merchant dashboard's theme, verbatim.
 *
 * This app is the sign-in surface for that product, so it uses the same palette and
 * type the customer already knows from app.reservonhq.com — not a token system of
 * its own. Values are copied from Reservon_Merchant_Dashboard/tailwind.config.js.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4237C9",
        secondary: "#F4B402",
        black: "#131315",
        gray: "#757480",
        black2: "#04111D",
        danger: "#D3351D",
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        gabarito: ["Gabarito", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
