import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#07090d",
        panel: "#0d1118",
        panelSoft: "#131923",
        line: "#253041",
        danger: "#ff3b5f",
        admin: "#31df82",
        note: "#ffd166",
        sky: "#4cc9f0"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(76,201,240,0.14), 0 16px 40px rgba(0,0,0,0.35)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
