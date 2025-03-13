/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      default: "var(--font-family-default)",
      mono: "var(--font-family-mono)",
    },
    fontWeight: {
      bold: "500",
    },
    borderRadius: {
      DEFAULT: "var(--radius-base)",
      lg: "var(--radius-lg)",
      full: "var(--radius-full)",
      none: "0",
    },
    colors: {
      text: {
        DEFAULT: "var(--color-text)",
        secondary: "var(--color-text-secondary)",
        danger: "var(--color-text-danger)",
        onbrand: "var(--color-text-onbrand)",
      },
      bg: {
        DEFAULT: "var(--color-bg)",
        secondary: "var(--color-bg-secondary)",
        menu: "var(--color-bg-menu)",
        selected: "var(--color-bg-selected)",
        brand: {
          DEFAULT: "var(--color-bg-brand)",
          pressed: "var(--color-bg-brand-pressed)",
        },
      },
      border: {
        DEFAULT: "var(--color-border)",
        selected: {
          DEFAULT: "var(--color-border-selected)",
          strong: "var(--color-border-selected-strong)",
        },
      },
    },
    fontSize: {
      sm: "var(--font-size-sm)",
      base: "var(--font-size-base)",
      lg: "var(--font-size-lg)",
    },
  },
  plugins: [],
};
