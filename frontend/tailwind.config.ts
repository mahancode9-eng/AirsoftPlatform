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
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // توکن‌های دیزاین‌سیستم تاکتیکال
        night: "#0C100A",
        panel: "#141A0F",
        panel2: "#1B2313",
        fog: "#E8E6DC",
        steel: "#2A3323",
        olive: "#5C7042",
        blaze: "#FF7A1A",
        neon: "#9EF01A",
        sand: "#C8B893",
        // توکن‌های قدیمی — نگاشت‌شده به تم تیره برای سازگاری صفحات فعلی
        ink: "#E8E6DC",
        muted: "#9AA28D",
        soft: "#0C100A",
        line: "#2A3323",
        accent: "#FF7A1A",
        accentsoft: "#33200F",
        positive: "#7ED957",
        danger: "#FF5648",
        army: "#8BA36B",
        armydark: "#5C7042",
      },
      boxShadow: {
        glow: "0 0 24px rgba(255,122,26,0.35)",
        neon: "0 0 18px rgba(158,240,26,0.4)",
      },
    },
  },
  plugins: [],
}

export default config
