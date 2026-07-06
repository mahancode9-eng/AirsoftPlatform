"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api, getToken, User } from "@/lib/api"

const menu = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/bookings", label: "رزروها" },
  { href: "/admin/sessions", label: "سانس‌ها" },
  { href: "/admin/fields", label: "زمین‌ها" },
  { href: "/admin/equipment", label: "تجهیزات اجاره‌ای" },
  { href: "/admin/events", label: "رویدادها" },
  { href: "/admin/leagues", label: "لیگ و مسابقات" },
  { href: "/admin/products", label: "محصولات" },
  { href: "/admin/orders", label: "سفارش‌ها" },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/reviews", label: "نظرات" },
  { href: "/admin/gallery", label: "گالری" },
  { href: "/admin/payments", label: "پرداخت‌ها" },
  { href: "/admin/settings", label: "تنظیمات و درگاه" },
]

export default function AdminLayout(props: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.push("/login")
      return
    }
    api<User>("/auth/me")
      .then((u) => {
        if (u.role !== "admin" && u.role !== "staff") {
          router.push("/")
          return
        }
        setUser(u)
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecked(true))
  }, [router])

  if (!checked || !user) {
    return <div className="py-20 text-center text-muted">در حال بررسی دسترسی...</div>
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="card sticky top-20 p-3">
          {menu.map((m) => {
            const active = pathname === m.href
            return (
              <Link
                key={m.href}
                href={m.href}
                className={
                  "block rounded-lg px-3 py-2 text-sm transition " +
                  (active ? "bg-army font-bold text-white" : "text-muted hover:bg-soft hover:text-ink")
                }
              >
                {m.label}
              </Link>
            )
          })}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="badge border border-line bg-white text-muted">
              {m.label}
            </Link>
          ))}
        </div>
        {props.children}
      </div>
    </div>
  )
}
