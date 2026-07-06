"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface SiteInfo {
  name: string
  phone: string
  instagram: string
  telegram: string
}

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo | null>(null)

  useEffect(() => {
    api<SiteInfo>("/site-info").then(setInfo).catch(() => null)
  }, [])

  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-2 font-bold text-army">{info?.name || "باشگاه ایرسافت"}</div>
          <p className="text-sm leading-6 text-muted">
            رزرو آنلاین سانس بازی، اجاره تجهیزات، رویدادهای سناریومحور و لیگ تیمی —
            همه در یک پلتفرم.
          </p>
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">دسترسی سریع</div>
          <div className="grid gap-1.5 text-sm text-muted">
            <Link href="/booking" className="hover:text-ink">رزرو بازی</Link>
            <Link href="/events" className="hover:text-ink">رویدادها</Link>
            <Link href="/rules" className="hover:text-ink">قوانین و ایمنی</Link>
            <Link href="/shop" className="hover:text-ink">فروشگاه</Link>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">ارتباط با ما</div>
          <div className="grid gap-1.5 text-sm text-muted">
            {info?.phone && <span>تلفن: {info.phone}</span>}
            {info?.instagram && (
              <a href={info.instagram} target="_blank" rel="noreferrer" className="hover:text-ink">
                اینستاگرام
              </a>
            )}
            {info?.telegram && (
              <a href={info.telegram} target="_blank" rel="noreferrer" className="hover:text-ink">
                تلگرام
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} — تمامی حقوق محفوظ است
      </div>
    </footer>
  )
}
