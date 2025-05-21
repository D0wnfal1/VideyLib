/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./pages*.{js,ts,jsx,tsx,mdx}",
    "./components*.{js,ts,jsx,tsx,mdx}",
    "./app*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      backgroundColor: {
        app: {
          light: "#f5f7fa",
          dark: "#121212",
        },
        card: {
          light: "#ffffff",
          dark: "#1e1e1e",
        },
      },
      textColor: {
        app: {
          light: "#333333",
          dark: "#e0e0e0",
        },
        muted: {
          light: "#64748b",
          dark: "#a0aec0",
        },
      },
      borderColor: {
        app: {
          light: "#e2e8f0",
          dark: "#2d2d2d",
        },
      },
    },
  },
  plugins: [],
};
