"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api, getToken, clearToken, User } from "@/lib/api"

const links = [
  { href: "/", label: "خانه" },
  { href: "/fields", label: "زمین‌ها" },
  { href: "/booking", label: "رزرو بازی" },
  { href: "/events", label: "رویدادها" },
  { href: "/leagues", label: "لیگ و تیم‌ها" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/gallery", label: "گالری" },
]

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)

  const loadUser = () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
  }

  useEffect(() => {
    loadUser()
    window.addEventListener("auth-changed", loadUser)
    return () => window.removeEventListener("auth-changed", loadUser)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-army">
            <span className="inline-block h-3 w-3 rounded-full bg-army" />
            باشگاه ایرسافت
          </Link>
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted transition hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {(user.role === "admin" || user.role === "staff") && (
                <Link href="/admin" className="btn-outline px-3 py-1.5 text-sm">
                  پنل مدیریت
                </Link>
              )}
              <Link href="/profile" className="btn-outline px-3 py-1.5 text-sm">
                {user.full_name}
              </Link>
              <button
                onClick={() => {
                  clearToken()
                  window.location.href = "/"
                }}
                className="text-sm text-muted hover:text-danger"
              >
                خروج
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-ink">
                ورود
              </Link>
              <Link href="/register" className="btn-primary px-4 py-1.5 text-sm">
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="منو"
        >
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-muted"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-3 border-t border-line pt-3">
            {user ? (
              <>
                {(user.role === "admin" || user.role === "staff") && (
                  <Link href="/admin" className="btn-outline flex-1 text-sm" onClick={() => setOpen(false)}>
                    پنل مدیریت
                  </Link>
                )}
                <Link href="/profile" className="btn-outline flex-1 text-sm" onClick={() => setOpen(false)}>
                  حساب من
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-outline flex-1 text-sm" onClick={() => setOpen(false)}>
                  ورود
                </Link>
                <Link href="/register" className="btn-primary flex-1 text-sm" onClick={() => setOpen(false)}>
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
