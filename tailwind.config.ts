import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cre: {
          green: "#2fb44b",
          "green-dark": "#26963e",
          "green-light": "#eaf7ed",
          "green-hover": "#28a242",
          navy: "#1c346f",
          "navy-dark": "#152754",
          "navy-light": "#edf2fa",
          "navy-hover": "#254490",
          bg: "#f7f9fc",
          card: "#ffffff",
          border: "#e2e8f0",
          text: "#1e293b",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["Montserrat", "sans-serif"],
        body: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
