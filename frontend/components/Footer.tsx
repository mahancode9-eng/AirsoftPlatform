import Link from "next/link"

const quickLinks = [
  { href: "/booking", label: "رزرو بازی" },
  { href: "/fields", label: "زمین‌ها" },
  { href: "/events", label: "رویدادها" },
  { href: "/leagues", label: "لیگ و تیم‌ها" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/rules", label: "قوانین ایمنی" },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-panel/60">
      <div className="hazard-stripes h-1 opacity-40" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 text-lg font-black">
            <span className="flex h-6 w-6 items-center justify-center border border-blaze/70 text-xs text-blaze">+</span>
            باشگاه ایرسافت
          </div>
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
            مرجع رزرو آنلاین سانس ایرسافت، اجاره گان و تجهیزات، لیگ و مسابقات. هیجان واقعی میدان نبرد —
            ایمن و حرفه‌ای.
          </p>
        </div>
        <div>
          <div className="section-tick mb-4 font-bold">دسترسی سریع</div>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted transition hover:text-blaze">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="section-tick mb-4 font-bold">تماس با ما</div>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>📍 آدرس مجموعه (از پنل تنظیمات قابل ویرایش)</li>
            <li>📞 ۰۹۱۲-۰۰۰-۰۰۰۰</li>
            <li className="flex items-center gap-2">
              <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-neon" />
              همه‌روزه از ۸ صبح تا ۳ بامداد
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-xs text-muted">
          <span>© {new Date().getFullYear()} باشگاه ایرسافت — همه حقوق محفوظ است</span>
          <span className="tracking-widest">TACTICAL UI v1.0</span>
        </div>
      </div>
    </footer>
  )
}
