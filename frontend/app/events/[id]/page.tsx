"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { api, fmtDate, fmtPrice, getToken, EventItem, Ticket, EVENT_TYPE_FA } from "@/lib/api"

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<EventItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!params?.id) return
    api<EventItem>(`/events/${params.id}`)
      .then(setEvent)
      .catch(() => setNotFound(true))
  }, [params?.id])

  const buy = async () => {
    if (!getToken()) {
      router.push("/login")
      return
    }
    if (!event) return
    setError("")
    setLoading(true)
    try {
      const ticket = await api<Ticket>("/events/tickets", {
        method: "POST",
        body: JSON.stringify({ event_id: event.id, quantity }),
      })
      if (ticket.total_amount <= 0 || ticket.status === "paid") {
        router.push(`/payment/result?status=success&kind=event&code=${ticket.code}`)
        return
      }
      const init = await api<{ redirect_url: string }>("/payments/init", {
        method: "POST",
        body: JSON.stringify({ kind: "event", ref_id: ticket.id }),
      })
      window.location.href = init.redirect_url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
      setLoading(false)
    }
  }

  if (notFound) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted">رویداد پیدا نشد.</div>
  if (!event) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted">در حال بارگذاری...</div>

  const remaining = event.capacity - (event.sold_tickets || 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {event.cover_photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.cover_photo} alt={event.title} className="mb-6 h-64 w-full rounded-xl object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <span className="badge bg-accentsoft text-accent">{EVENT_TYPE_FA[event.event_type] || event.event_type}</span>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-muted">
        <span>شروع: {fmtDate(event.start_time)}</span>
        <span>پایان: {fmtDate(event.end_time)}</span>
      </div>
      <p className="mt-5 max-w-3xl whitespace-pre-line leading-8">{event.description}</p>

      <div className="card mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">قیمت بلیت</div>
          <div className="text-xl font-bold text-army">{fmtPrice(event.ticket_price)}</div>
          <div className="mt-1 text-sm text-muted">ظرفیت باقی‌مانده: {remaining}</div>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="label">تعداد</label>
            <input
              type="number"
              min={1}
              max={Math.max(remaining, 1)}
              className="input w-24"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <button className="btn-primary" disabled={loading || remaining <= 0} onClick={buy}>
            {remaining <= 0 ? "تکمیل ظرفیت" : loading ? "در حال ثبت..." : "خرید بلیت"}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  )
}
