"use client"

import { useEffect, useState } from "react"
import { api, fmtDate, fmtPrice, Booking, BOOKING_STATUS_FA } from "@/lib/api"

const STATUSES = ["", "pending_payment", "confirmed", "cancelled", "attended"]

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState("")
  const [error, setError] = useState("")

  const load = (f: string) => {
    api<Booking[]>(`/admin/bookings${f ? `?status=${f}` : ""}`)
      .then(setBookings)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "خطا"))
  }

  useEffect(() => load(filter), [filter])

  const setStatus = async (id: number, status: string) => {
    try {
      await api(`/admin/bookings/${id}/status?status=${status}`, { method: "POST" })
      load(filter)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت رزروها</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm " +
              (filter === s ? "border-army bg-army text-white" : "border-line bg-white text-muted")
            }
          >
            {s === "" ? "همه" : BOOKING_STATUS_FA[s] || s}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-5 grid gap-3">
        {bookings.map((b) => (
          <div key={b.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold">
                <span dir="ltr">{b.code}</span> — {b.session?.field?.name || "سانس"}
              </div>
              <select
                className="input w-auto py-1 text-sm"
                value={b.status}
                onChange={(e) => setStatus(b.id, e.target.value)}
              >
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{BOOKING_STATUS_FA[s] || s}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 grid gap-1 text-sm text-muted">
              {b.session && <span>زمان: {fmtDate(b.session.start_time)}</span>}
              <span>نفرات: {b.num_players}{b.is_group && b.group_name ? ` · گروه: ${b.group_name}` : ""} · مبلغ: {fmtPrice(b.total_amount)}</span>
              <span>فرم ایمنی: {b.waiver ? `امضا شده (${b.waiver.full_name})` : "امضا نشده"}</span>
              {b.note && <span>یادداشت: {b.note}</span>}
            </div>
          </div>
        ))}
        {bookings.length === 0 && <p className="text-muted">رزروی یافت نشد.</p>}
      </div>
    </div>
  )
}
