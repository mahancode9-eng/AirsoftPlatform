import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "Tahoma", "sans-serif"],
      },
      colors: {
        ink: "#2C2C2B",
        muted: "#7D7A75",
        soft: "#F9F8F7",
        line: "#E6E5E3",
        accent: "#2783DE",
        accentsoft: "#E5F2FC",
        positive: "#46A171",
        danger: "#E56458",
        army: "#3F4A3C",
        armydark: "#2B332A",
        sand: "#C8B893",
      },
    },
  },
  plugins: [],
}

export default config
