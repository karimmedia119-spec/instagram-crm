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
        canvas: "#F4F5F7",
        surface: "#FFFFFF",
        subtle: "#ECEEF2",
        borderline: "#E2E5EC",
        muted: "#8E95A2",
        body: "#525866",
        charcoal: "#181A1F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-arabic)", "sans-serif"],
        arabic: ["var(--font-arabic)", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 12px 30px -10px rgba(24, 26, 31, 0.08)",
        lift: "0 20px 35px -12px rgba(24, 26, 31, 0.12)",
        subtle: "0 2px 8px 0 rgba(24, 26, 31, 0.04)",
      },
      borderRadius: {
        apple: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
