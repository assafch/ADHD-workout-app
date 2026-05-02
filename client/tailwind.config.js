/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0d0d0e",
        bg: "#1c1b1a",
        surface: "#252220",
        "surface-2": "#2a2724",
        line: "#3a3633",
        text: "#f5f1ea",
        "text-2": "#c9c2b6",
        "text-mute": "#8a8378",
        "text-dim": "#5a5550",
        accent: "#d97047",
        "accent-2": "#a8421f",
        warn: "#d9aa47",
        ai: "#7a6cd9",
      },
      fontFamily: {
        sans: ['"Heebo"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Heebo"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        cursive: ['"Caveat"', "cursive"],
      },
      fontSize: {
        eyebrow: ["11px", { lineHeight: "1.2", letterSpacing: "0.16em" }],
        meta: ["11px", { lineHeight: "1.2" }],
        body: ["14px", { lineHeight: "1.45" }],
        cta: ["21px", { lineHeight: "1" }],
        section: ["32px", { lineHeight: "1.05" }],
        "section-lg": ["38px", { lineHeight: "1.05" }],
        "hero-num": ["96px", { lineHeight: "1" }],
        "hero-num-lg": ["110px", { lineHeight: "1" }],
        "hero-day": ["78px", { lineHeight: "1" }],
        "timer-xl": ["130px", { lineHeight: "1" }],
        huge: ["72px", { lineHeight: "1" }],
        big: ["48px", { lineHeight: "1.05" }],
      },
      letterSpacing: {
        eyebrow: "0.16em",
        hero: "-0.025em",
        "hero-tight": "-0.04em",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "24px",
        hero: "28px",
        sheet: "32px",
      },
      boxShadow: {
        "cta-glow": "0 0 0 6px rgba(217,112,71,0.20)",
        "streak-halo":
          "0 0 0 18px rgba(217,112,71,0.08), 0 0 0 38px rgba(217,112,71,0.04)",
        "sticky-press": "0 8px 0 #a8421f",
        "rest-halo":
          "0 0 0 18px rgba(217,112,71,0.10), 0 0 0 38px rgba(217,112,71,0.05)",
      },
      minHeight: {
        tap: "44px",
        cta: "84px",
        "cta-lg": "88px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};
