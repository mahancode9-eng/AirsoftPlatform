"use client"

import { useEffect, useState } from "react"
import { api, fmtPrice, Equipment } from "@/lib/api"

const EMPTY = {
  name: "",
  description: "",
  category: "gun",
  price_per_session: 0,
  stock: 0,
  photo: "",
  is_active: true,
}

const CATEGORY_FA: Record<string, string> = {
  gun: "سلاح",
  protection: "تجهیزات حفاظتی",
  clothing: "لباس",
  accessory: "لوازم جانبی",
}

export default function AdminEquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([])
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const load = () => api<Equipment[]>("/admin/equipment").then(setItems).catch(() => null)
  useEffect(() => { load() }, [])

  const save = async () => {
    setError("")
    try {
      const body = JSON.stringify(form)
      if (editId) await api(`/admin/equipment/${editId}`, { method: "PUT", body })
      else await api("/admin/equipment", { method: "POST", body })
      setForm(EMPTY)
      setEditId(null)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">تجهیزات اجاره‌ای</h1>

      <div className="card mt-5 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 font-bold">{editId ? "ویرایش" : "مورد جدید"}</div>
        <div>
          <label className="label">نام</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">دسته</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(CATEGORY_FA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">قیمت اجاره هر سانس (تومان)</label>
          <input type="number" className="input" value={form.price_per_session} onChange={(e) => setForm({ ...form, price_per_session: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">موجودی</label>
          <input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">توضیحات</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <button className="btn-primary flex-1" disabled={!form.name} onClick={save}>
            {editId ? "ذخیره" : "افزودن"}
          </button>
          {editId && <button className="btn-outline" onClick={() => { setEditId(null); setForm(EMPTY) }}>انصراف</button>}
        </div>
        {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      </div>

      <div className="mt-6 grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold">{it.name} <span className="text-xs text-muted">({CATEGORY_FA[it.category] || it.category})</span></div>
              <div className="mt-1 text-sm text-muted">{fmtPrice(it.price_per_session)} / سانس · موجودی: {it.stock}</div>
            </div>
            <button
              className="btn-outline px-4 py-1.5 text-sm"
              onClick={() => {
                setEditId(it.id)
                setForm({
                  name: it.name,
                  description: it.description,
                  category: it.category,
                  price_per_session: it.price_per_session,
                  stock: it.stock,
                  photo: it.photo,
                  is_active: it.is_active,
                })
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            >
              ویرایش
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
