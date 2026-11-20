import type { Config } from "tailwindcss";

/**
 * Design tokens for Muhurat. Change brand colours and fonts here;
 * every screen reads them through Tailwind classes such as `bg-paper` or `text-sindoor`.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF9F5", // page background
        surface: "#FFFFFF", // panels and cards
        ink: "#1D1B18", // main text and primary buttons
        muted: "#6B655C", // secondary text
        line: "#E5DED2", // borders and dividers
        sindoor: "#A8251C", // accent: selected state, links, highlights
        haldi: "#C98A1E", // secondary accent: notes
      },
      fontFamily: {
        display: ['"Bodoni Moda"', "Didot", "Georgia", "serif"],
        body: ['"Work Sans"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
