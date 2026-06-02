import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#000000",
        gold: {
          500: "#EAB308",
          600: "#CA8A04",
        },
      },
      backdropBlur: {
        premium: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
