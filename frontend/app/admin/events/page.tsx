"use client"

import { useEffect, useState } from "react"
import { api, fmtDate, fmtPrice, EventItem, EVENT_TYPE_FA } from "@/lib/api"

const EMPTY = {
  title: "",
  description: "",
  event_type: "scenario",
  field_id: null as number | null,
  start_time: "",
  end_time: "",
  ticket_price: 0,
  capacity: 40,
  cover_photo: "",
  is_active: true,
}

interface TicketRow {
  id: number
  code: string
  quantity: number
  total_amount: number
  status: string
  user_name: string
  user_phone: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [tickets, setTickets] = useState<TicketRow[] | null>(null)
  const [ticketsFor, setTicketsFor] = useState<string>("")
  const [error, setError] = useState("")

  const load = () => api<EventItem[]>("/admin/events").then(setEvents).catch(() => null)
  useEffect(() => { load() }, [])

  const save = async () => {
    setError("")
    try {
      const body = JSON.stringify(form)
      if (editId) await api(`/admin/events/${editId}`, { method: "PUT", body })
      else await api("/admin/events", { method: "POST", body })
      setForm(EMPTY)
      setEditId(null)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  const showTickets = async (e: EventItem) => {
    setTicketsFor(e.title)
    setTickets(await api<TicketRow[]>(`/admin/events/${e.id}/tickets`).catch(() => []))
  }

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت رویدادها</h1>

      <div className="card mt-5 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 font-bold">{editId ? "ویرایش رویداد" : "رویداد جدید"}</div>
        <div>
          <label className="label">عنوان</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">نوع</label>
          <select className="input" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
            {Object.entries(EVENT_TYPE_FA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">شروع (UTC)</label>
          <input type="datetime-local" className="input" dir="ltr" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div>
          <label className="label">پایان (UTC)</label>
          <input type="datetime-local" className="input" dir="ltr" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        </div>
        <div>
          <label className="label">قیمت بلیت (تومان)</label>
          <input type="number" className="input" value={form.ticket_price} onChange={(e) => setForm({ ...form, ticket_price: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">ظرفیت</label>
          <input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">توضیحات و سناریو</label>
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <button className="btn-primary flex-1" disabled={!form.title || !form.start_time || !form.end_time} onClick={save}>
            {editId ? "ذخیره" : "افزودن رویداد"}
          </button>
          {editId && <button className="btn-outline" onClick={() => { setEditId(null); setForm(EMPTY) }}>انصراف</button>}
        </div>
        {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      </div>

      <div className="mt-6 grid gap-3">
        {events.map((e) => (
          <div key={e.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold">{e.title} <span className="text-xs text-muted">({EVENT_TYPE_FA[e.event_type] || e.event_type})</span></div>
              <div className="mt-1 text-sm text-muted">
                {fmtDate(e.start_time)} · {fmtPrice(e.ticket_price)} · فروش: {e.sold_tickets ?? 0}/{e.capacity}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline px-4 py-1.5 text-sm" onClick={() => showTickets(e)}>بلیت‌ها</button>
              <button
                className="btn-outline px-4 py-1.5 text-sm"
                onClick={() => {
                  setEditId(e.id)
                  setForm({
                    title: e.title,
                    description: e.description,
                    event_type: e.event_type,
                    field_id: e.field_id,
                    start_time: e.start_time.slice(0, 16),
                    end_time: e.end_time.slice(0, 16),
                    ticket_price: e.ticket_price,
                    capacity: e.capacity,
                    cover_photo: e.cover_photo,
                    is_active: e.is_active,
                  })
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              >
                ویرایش
              </button>
            </div>
          </div>
        ))}
      </div>

      {tickets && (
        <div className="card mt-6 overflow-x-auto p-0">
          <div className="border-b border-line p-4 font-bold">بلیت‌های «{ticketsFor}»</div>
          {tickets.length === 0 ? (
            <p className="p-5 text-muted">بلیتی فروخته نشده است.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-muted">
                  <th className="p-3">کد</th>
                  <th className="p-3">خریدار</th>
                  <th className="p-3">تماس</th>
                  <th className="p-3">تعداد</th>
                  <th className="p-3">مبلغ</th>
                  <th className="p-3">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="p-3" dir="ltr">{t.code}</td>
                    <td className="p-3">{t.user_name}</td>
                    <td className="p-3" dir="ltr">{t.user_phone}</td>
                    <td className="p-3">{t.quantity}</td>
                    <td className="p-3">{fmtPrice(t.total_amount)}</td>
                    <td className="p-3">{t.status === "paid" ? "پرداخت شده" : t.status === "pending_payment" ? "در انتظار پرداخت" : t.status}</td>
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
