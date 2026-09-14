/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          bg: "rgb(var(--bg-canvas) / <alpha-value>)",
          surface: "rgb(var(--surface-card) / <alpha-value>)",
          "surface-subtle": "rgb(var(--surface-subtle) / <alpha-value>)",
          "surface-active": "rgb(var(--surface-active) / <alpha-value>)",
          border: "rgb(var(--border-color) / <alpha-value>)",
          "border-hover": "rgb(var(--border-hover) / <alpha-value>)",
          "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
          "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
          primary: "rgb(var(--primary-mint) / <alpha-value>)",
          "primary-hover": "rgb(var(--primary-hover) / <alpha-value>)",
          cyan: "rgb(var(--secondary-cyan) / <alpha-value>)",
          amber: "rgb(var(--secondary-amber) / <alpha-value>)",
          error: "rgb(var(--secondary-error) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 12px rgba(var(--glow-primary), 0.35)",
        "glow-cyan": "0 0 12px rgba(var(--glow-cyan), 0.35)",
        "glow-amber": "0 0 12px rgba(var(--glow-amber), 0.35)",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
