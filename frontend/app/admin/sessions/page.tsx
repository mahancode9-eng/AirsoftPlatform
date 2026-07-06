"use client"

import { useEffect, useState } from "react"
import { api, fmtDate, fmtPrice, Field, GameSession, SESSION_TYPE_FA } from "@/lib/api"

const EMPTY = {
  field_id: 0,
  title: "",
  session_type: "open_play",
  start_time: "",
  end_time: "",
  capacity: 20,
  price_per_player: 0,
  is_active: true,
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const load = () => {
    api<GameSession[]>("/admin/sessions").then(setSessions).catch(() => null)
    api<Field[]>("/admin/fields").then(setFields).catch(() => null)
  }
  useEffect(load, [])

  const save = async () => {
    setError("")
    try {
      const body = JSON.stringify(form)
      if (editId) await api(`/admin/sessions/${editId}`, { method: "PUT", body })
      else await api("/admin/sessions", { method: "POST", body })
      setForm(EMPTY)
      setEditId(null)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  const startEdit = (s: GameSession) => {
    setEditId(s.id)
    setForm({
      field_id: s.field_id,
      title: s.title,
      session_type: s.session_type,
      start_time: s.start_time.slice(0, 16),
      end_time: s.end_time.slice(0, 16),
      capacity: s.capacity,
      price_per_player: s.price_per_player,
      is_active: true,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت سانس‌ها</h1>

      <div className="card mt-5 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 font-bold">{editId ? "ویرایش سانس" : "سانس جدید"}</div>
        <div>
          <label className="label">زمین</label>
          <select className="input" value={form.field_id} onChange={(e) => setForm({ ...form, field_id: Number(e.target.value) })}>
            <option value={0}>انتخاب کنید...</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">عنوان (اختیاری)</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">نوع سانس</label>
          <select className="input" value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })}>
            {Object.entries(SESSION_TYPE_FA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">ظرفیت</label>
          <input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">شروع (به وقت UTC)</label>
          <input type="datetime-local" className="input" dir="ltr" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div>
          <label className="label">پایان (به وقت UTC)</label>
          <input type="datetime-local" className="input" dir="ltr" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        </div>
        <div>
          <label className="label">قیمت هر نفر (تومان)</label>
          <input type="number" className="input" value={form.price_per_player} onChange={(e) => setForm({ ...form, price_per_player: Number(e.target.value) })} />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-primary flex-1" disabled={!form.field_id || !form.start_time || !form.end_time} onClick={save}>
            {editId ? "ذخیره تغییرات" : "افزودن سانس"}
          </button>
          {editId && (
            <button className="btn-outline" onClick={() => { setEditId(null); setForm(EMPTY) }}>انصراف</button>
          )}
        </div>
        {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      </div>

      <div className="mt-6 grid gap-3">
        {sessions.map((s) => (
          <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold">{s.title || s.field?.name} <span className="text-xs text-muted">({SESSION_TYPE_FA[s.session_type] || s.session_type})</span></div>
              <div className="mt-1 text-sm text-muted">{fmtDate(s.start_time)} · ظرفیت {s.capacity} · {fmtPrice(s.price_per_player)}</div>
            </div>
            <button className="btn-outline px-4 py-1.5 text-sm" onClick={() => startEdit(s)}>ویرایش</button>
          </div>
        ))}
      </div>
    </div>
  )
}
