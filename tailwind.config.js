/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // slate-950
        surface: "#1e293b",    // slate-800
        primary: "#3b82f6",    // blue-500
        "primary-hover": "#2563eb", // blue-600
        text: "#f1f5f9",       // slate-100
        muted: "#94a3b8",      // slate-400
        border: "#334155",     // slate-700
      }
    },
  },
  plugins: [],
}
