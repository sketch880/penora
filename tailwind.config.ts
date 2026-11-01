import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        soft: {
          cream: "#faf8f5",
          beige: "#f5f0e8",
          sand: "#e8e0d5",
          sage: "#d4e0d9",
          mist: "#e8f0ee",
        },
      },
      fontFamily: {
        vazir: ["Vazirmatn", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        "soft-lg": "0 10px 40px -5px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
