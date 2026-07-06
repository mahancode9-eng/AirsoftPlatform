"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  api,
  fmtDate,
  fmtPrice,
  getToken,
  Booking,
  Order,
  PaymentRecord,
  Ticket,
  User,
  BOOKING_STATUS_FA,
} from "@/lib/api"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [tab, setTab] = useState<"bookings" | "tickets" | "orders" | "payments">("bookings")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!getToken()) {
      router.push("/login")
      return
    }
    api<User>("/auth/me").then(setUser).catch(() => router.push("/login"))
    api<Booking[]>("/bookings/my").then(setBookings).catch(() => null)
    api<Ticket[]>("/events/tickets/my").then(setTickets).catch(() => null)
    api<Order[]>("/orders/my").then(setOrders).catch(() => null)
    api<PaymentRecord[]>("/payments/my").then(setPayments).catch(() => null)
  }, [router])

  const cancelBooking = async (id: number) => {
    setMessage("")
    try {
      await api(`/bookings/${id}/cancel`, { method: "POST" })
      setMessage("رزرو لغو شد.")
      api<Booking[]>("/bookings/my").then(setBookings).catch(() => null)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "خطا")
    }
  }

  const payFor = async (kind: string, refId: number) => {
    setMessage("")
    try {
      const init = await api<{ redirect_url: string }>("/payments/init", {
        method: "POST",
        body: JSON.stringify({ kind, ref_id: refId }),
      })
      window.location.href = init.redirect_url
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "خطا")
    }
  }

  if (!user) return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted">در حال بارگذاری...</div>

  const statusBadge = (status: string) => (
    <span
      className={
        "badge " +
        (status === "confirmed" || status === "paid" || status === "delivered"
          ? "bg-green-50 text-positive"
          : status === "cancelled" || status === "failed"
          ? "bg-red-50 text-danger"
          : "bg-accentsoft text-accent")
      }
    >
      {BOOKING_STATUS_FA[status] || status}
    </span>
  )

  const tabs = [
    { id: "bookings" as const, label: `رزروها (${bookings.length})` },
    { id: "tickets" as const, label: `بلیت‌ها (${tickets.length})` },
    { id: "orders" as const, label: `سفارش‌ها (${orders.length})` },
    { id: "payments" as const, label: `پرداخت‌ها (${payments.length})` },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">حساب کاربری</h1>
      <div className="card mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-bold">{user.full_name}</div>
          <div className="mt-1 text-sm text-muted" dir="ltr">{user.phone}</div>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "whitespace-nowrap px-4 py-2 text-sm transition " +
              (tab === t.id ? "border-b-2 border-army font-bold text-army" : "text-muted hover:text-ink")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="mt-4 text-sm text-accent">{message}</p>}

      {tab === "bookings" && (
        <div className="mt-6 grid gap-3">
          {bookings.length === 0 && <p className="text-muted">رزروی ثبت نشده است.</p>}
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold">{b.session?.title || b.session?.field?.name || "سانس"}</div>
                {statusBadge(b.status)}
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted">
                <span>کد رهگیری: <span dir="ltr">{b.code}</span></span>
                {b.session && <span>زمان: {fmtDate(b.session.start_time)}</span>}
                <span>نفرات: {b.num_players} · مبلغ: {fmtPrice(b.total_amount)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {b.status === "pending_payment" && (
                  <>
                    <button className="btn-primary px-4 py-1.5 text-sm" onClick={() => payFor("booking", b.id)}>
                      پرداخت
                    </button>
                    <button className="btn-outline px-4 py-1.5 text-sm" onClick={() => cancelBooking(b.id)}>
                      لغو
                    </button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <button className="btn-outline px-4 py-1.5 text-sm" onClick={() => cancelBooking(b.id)}>
                    لغو رزرو
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tickets" && (
        <div className="mt-6 grid gap-3">
          {tickets.length === 0 && <p className="text-muted">بلیتی خریداری نشده است.</p>}
          {tickets.map((t) => (
            <div key={t.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold">{t.event?.title || "رویداد"}</div>
                {statusBadge(t.status)}
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted">
                <span>کد بلیت: <span dir="ltr">{t.code}</span></span>
                {t.event && <span>زمان: {fmtDate(t.event.start_time)}</span>}
                <span>تعداد: {t.quantity} · مبلغ: {fmtPrice(t.total_amount)}</span>
              </div>
              {t.status === "pending_payment" && (
                <button className="btn-primary mt-3 px-4 py-1.5 text-sm" onClick={() => payFor("event", t.id)}>
                  پرداخت
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 grid gap-3">
          {orders.length === 0 && <p className="text-muted">سفارشی ثبت نشده است.</p>}
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold">سفارش <span dir="ltr">{o.code}</span></div>
                {statusBadge(o.status)}
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted">
                {o.items.map((it, i) => (
                  <span key={i}>
                    {it.product?.name || "کالا"} × {it.quantity} — {fmtPrice(it.unit_price * it.quantity)}
                  </span>
                ))}
                <span className="font-bold text-ink">جمع: {fmtPrice(o.total_amount)}</span>
              </div>
              {o.status === "pending_payment" && (
                <button className="btn-primary mt-3 px-4 py-1.5 text-sm" onClick={() => payFor("order", o.id)}>
                  پرداخت
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "payments" && (
        <div className="card mt-6 overflow-x-auto p-0">
          {payments.length === 0 ? (
            <p className="p-5 text-muted">پرداختی ثبت نشده است.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">مبلغ</th>
                  <th className="p-3">درگاه</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">کد پیگیری</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="p-3">{fmtDate(p.created_at)}</td>
                    <td className="p-3">{fmtPrice(p.amount)}</td>
                    <td className="p-3">{p.gateway}</td>
                    <td className="p-3">{statusBadge(p.status)}</td>
                    <td className="p-3" dir="ltr">{p.gateway_ref || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
