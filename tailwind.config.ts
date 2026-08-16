import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        night: '#0b1220', panel: '#101a2e', edge: '#22314e',
        mint: '#34d399', tealx: '#2dd4bf', amberx: '#fbbf24', rosex: '#fb7185',
      },
    },
  },
  plugins: [],
};
export default config;
