import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#09090f",
        electric: "#5eead4",
        berry: "#f472b6",
        skyglow: "#38bdf8",
        gold: "#fbbf24"
      },
      boxShadow: {
        neon: "0 0 30px rgba(94, 234, 212, 0.25)"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
