/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        n900: "#070B14",
        n850: "#0B1220",
        n800: "#111A2B",
        n700: "#1A2440",
        line: "#2A3352",
        electric: {
          400: "#22D3EE",
          500: "#6366F1",
          600: "#4F46E5",
        },
        ember: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        lime: {
          400: "#67E8F9",
        },
        rose: {
          500: "#EC4899",
        },
        text: {
          strong: "#F8FAFC",
          mid: "#E2E8F0",
          dim: "#94A3B8",
        },
      },
      boxShadow: {
        electric:
          "0 0 0 1px rgba(99,102,241,.35), 0 12px 36px rgba(99,102,241,.20)",
        ember:
          "0 0 0 1px rgba(139,92,246,.35), 0 12px 36px rgba(139,92,246,.20)",
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "brand-main": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #22D3EE 100%)",
        "cta-hot": "linear-gradient(135deg, #4F46E5 0%, #8B5CF6 45%, #22D3EE 100%)",
      },
    },
  },
  plugins: [],
}

