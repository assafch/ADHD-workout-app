/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Heebo"', "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        huge: ["72px", { lineHeight: "1" }],
        big: ["48px", { lineHeight: "1.05" }],
      },
      minHeight: {
        tap: "56px",
      },
      minWidth: {
        tap: "56px",
      },
    },
  },
  plugins: [],
};
