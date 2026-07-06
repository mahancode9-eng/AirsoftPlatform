"use client"

import { useEffect, useState } from "react"
import { api, fmtPrice } from "@/lib/api"

interface Stats {
  users: number
  bookings_total: number
  bookings_confirmed: number
  upcoming_sessions: number
  events: number
  teams: number
  orders_pending: number
  revenue_total: number
  revenue_month: number
  pending_reviews: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api<Stats>("/admin/stats")
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "خطا"))
  }, [])

  if (error) return <p className="text-danger">{error}</p>
  if (!stats) return <p className="text-muted">در حال بارگذاری...</p>

  const cards = [
    { label: "درآمد کل", value: fmtPrice(stats.revenue_total) },
    { label: "درآمد ۳۰ روز اخیر", value: fmtPrice(stats.revenue_month) },
    { label: "کاربران", value: stats.users.toLocaleString("fa-IR") },
    { label: "کل رزروها", value: stats.bookings_total.toLocaleString("fa-IR") },
    { label: "رزروهای تأییدشده", value: stats.bookings_confirmed.toLocaleString("fa-IR") },
    { label: "سانس‌های پیش رو", value: stats.upcoming_sessions.toLocaleString("fa-IR") },
    { label: "رویدادهای فعال", value: stats.events.toLocaleString("fa-IR") },
    { label: "تیم‌ها", value: stats.teams.toLocaleString("fa-IR") },
    { label: "سفارش در انتظار ارسال", value: stats.orders_pending.toLocaleString("fa-IR") },
    { label: "نظرات در انتظار تأیید", value: stats.pending_reviews.toLocaleString("fa-IR") },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold">داشبورد</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-sm text-muted">{c.label}</div>
            <div className="mt-2 text-xl font-bold text-army">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
