"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api, fmtPrice, fmtDate, GameSession, EventItem, SESSION_TYPE_FA } from "@/lib/api"

export default function HomePage() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    api<GameSession[]>("/sessions?days=7").then((s) => setSessions(s.slice(0, 4))).catch(() => null)
    api<EventItem[]>("/events").then((e) => setEvents(e.slice(0, 3))).catch(() => null)
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-army text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <h1 className="text-3xl font-bold leading-relaxed md:text-5xl md:leading-relaxed">
            هیجان واقعی میدان نبرد
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-8 text-white/80">
            سانس بازی را آنلاین رزرو کن، تجهیزات را همان‌جا اجاره کن و با تیمت وارد لیگ شو.
            همه‌چیز فقط با چند کلیک.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/booking" className="rounded-lg bg-white px-6 py-3 font-bold text-army transition hover:bg-sand">
              رزرو بازی
            </Link>
            <Link href="/fields" className="rounded-lg border border-white/40 px-6 py-3 text-white transition hover:bg-white/10">
              مشاهده زمین‌ها
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card text-center">
            <div className="text-3xl">🎯</div>
            <div className="mt-2 font-bold">رزرو آنلاین سانس</div>
            <p className="mt-1 text-sm text-muted">ظرفیت لحظه‌ای و پرداخت امن</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl">🛡️</div>
            <div className="mt-2 font-bold">اجاره تجهیزات</div>
            <p className="mt-1 text-sm text-muted">پکیج کامل برای تازه‌کارها</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl">🏆</div>
            <div className="mt-2 font-bold">لیگ و مسابقات</div>
            <p className="mt-1 text-sm text-muted">تیم بساز و در جدول بالا برو</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl">🎉</div>
            <div className="mt-2 font-bold">رویدادهای ویژه</div>
            <p className="mt-1 text-sm text-muted">سناریوهای شبانه و میل‌سیم</p>
          </div>
        </div>
      </section>

      {/* Upcoming sessions */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">سانس‌های پیش رو</h2>
          <Link href="/booking" className="text-sm text-accent hover:underline">
            مشاهده همه
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-muted">فعلاً سانسی ثبت نشده است.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sessions.map((s) => (
              <Link key={s.id} href={`/booking?session=${s.id}`} className="card transition hover:border-army">
                <div className="badge bg-accentsoft text-accent">{SESSION_TYPE_FA[s.session_type] || s.session_type}</div>
                <div className="mt-2 font-bold">{s.title || s.field?.name}</div>
                <div className="mt-1 text-sm text-muted">{s.field?.name}</div>
                <div className="mt-2 text-sm text-muted">{fmtDate(s.start_time)}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-army">{fmtPrice(s.price_per_player)}</span>
                  <span className="text-muted">ظرفیت: {s.remaining_capacity}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">رویدادهای ویژه</h2>
              <Link href="/events" className="text-sm text-accent hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="card transition hover:border-army">
                  <div className="font-bold">{e.title}</div>
                  <div className="mt-2 text-sm text-muted">{fmtDate(e.start_time)}</div>
                  <div className="mt-3 text-sm font-bold text-army">{fmtPrice(e.ticket_price)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
