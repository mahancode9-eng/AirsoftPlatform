"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api, fmtDate, fmtPrice, EventItem, EVENT_TYPE_FA } from "@/lib/api"

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<EventItem[]>("/events")
      .then(setEvents)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">رویدادها و مسابقات</h1>
      <p className="mt-2 text-muted">سناریوهای ویژه، بازی‌های شبانه و تورنمنت‌ها</p>
      {loading ? (
        <p className="mt-8 text-muted">در حال بارگذاری...</p>
      ) : events.length === 0 ? (
        <p className="mt-8 text-muted">فعلاً رویداد فعالی وجود ندارد.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const remaining = e.capacity - (e.sold_tickets || 0)
            return (
              <Link key={e.id} href={`/events/${e.id}`} className="card transition hover:border-army">
                {e.cover_photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.cover_photo} alt={e.title} className="mb-4 h-40 w-full rounded-lg object-cover" />
                )}
                <div className="badge bg-accentsoft text-accent">{EVENT_TYPE_FA[e.event_type] || e.event_type}</div>
                <div className="mt-2 text-lg font-bold">{e.title}</div>
                <div className="mt-1 text-sm text-muted">{fmtDate(e.start_time)}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-army">{fmtPrice(e.ticket_price)}</span>
                  <span className={remaining > 0 ? "text-muted" : "text-danger"}>
                    {remaining > 0 ? `ظرفیت: ${remaining}` : "تکمیل ظرفیت"}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
