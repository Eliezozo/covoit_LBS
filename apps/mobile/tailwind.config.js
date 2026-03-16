/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1e3a8a",
        "slate-gray": "#64748b",
        "slate-light": "#e2e8f0",
        "slate-dark": "#0f172a"
      }
    }
  },
  plugins: []
};
