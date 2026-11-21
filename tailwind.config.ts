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
        glass: "0 20px 40px -15px rgba(24, 26, 31, 0.07), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)",
        "glass-hover": "0 25px 50px -12px rgba(24, 26, 31, 0.12), inset 0 1px 2px 0 rgba(255, 255, 255, 0.95)",
        "glass-inset": "inset 0 2px 4px 0 rgba(24, 26, 31, 0.04)",
        "glass-btn": "0 8px 20px -4px rgba(24, 26, 31, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)",
        "glass-btn-hover": "0 14px 28px -4px rgba(24, 26, 31, 0.35), inset 0 1px 2px 0 rgba(255, 255, 255, 0.45)",
      },
      borderRadius: {
        apple: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
