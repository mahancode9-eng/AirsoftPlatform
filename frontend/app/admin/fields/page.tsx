"use client"

import { useEffect, useState } from "react"
import { api, Field, FIELD_TYPE_FA } from "@/lib/api"

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  field_type: "outdoor",
  address: "",
  capacity: 30,
  features: {} as Record<string, boolean>,
  photos: [] as string[],
  is_active: true,
}

export default function AdminFieldsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [photoUrl, setPhotoUrl] = useState("")
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  const load = () => api<Field[]>("/admin/fields").then(setFields).catch(() => null)
  useEffect(() => { load() }, [])

  const save = async () => {
    setError("")
    try {
      const body = JSON.stringify(form)
      if (editId) await api(`/admin/fields/${editId}`, { method: "PUT", body })
      else await api("/admin/fields", { method: "POST", body })
      setForm(EMPTY)
      setEditId(null)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  const upload = async (file: File) => {
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await api<{ url: string }>("/admin/upload", { method: "POST", body: fd })
      setForm((prev) => ({ ...prev, photos: [...prev.photos, res.url] }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا در آپلود")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت زمین‌ها</h1>

      <div className="card mt-5 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 font-bold">{editId ? "ویرایش زمین" : "زمین جدید"}</div>
        <div>
          <label className="label">نام</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">اسلاگ (انگلیسی، برای آدرس صفحه)</label>
          <input className="input" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="alpha-forest" />
        </div>
        <div>
          <label className="label">نوع زمین</label>
          <select className="input" value={form.field_type} onChange={(e) => setForm({ ...form, field_type: e.target.value })}>
            {Object.entries(FIELD_TYPE_FA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">ظرفیت کل</label>
          <input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">آدرس</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">توضیحات</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">تصاویر</label>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {uploading && <span className="text-sm text-muted">در حال آپلود...</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input className="input flex-1" dir="ltr" placeholder="یا آدرس تصویر را وارد کنید" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
            <button className="btn-outline" onClick={() => { if (photoUrl) { setForm((p) => ({ ...p, photos: [...p.photos, photoUrl] })); setPhotoUrl("") } }}>افزودن</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.photos.map((p, i) => (
              <span key={i} className="badge border border-line bg-soft" dir="ltr">
                {p.slice(0, 40)}{" "}
                <button className="text-danger" onClick={() => setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}>×</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <button className="btn-primary flex-1" disabled={!form.name || !form.slug} onClick={save}>
            {editId ? "ذخیره تغییرات" : "افزودن زمین"}
          </button>
          {editId && <button className="btn-outline" onClick={() => { setEditId(null); setForm(EMPTY) }}>انصراف</button>}
        </div>
        {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
      </div>

      <div className="mt-6 grid gap-3">
        {fields.map((f) => (
          <div key={f.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold">{f.name} <span className="text-xs text-muted">({FIELD_TYPE_FA[f.field_type] || f.field_type})</span></div>
              <div className="mt-1 text-sm text-muted" dir="ltr">/{f.slug}</div>
            </div>
            <button
              className="btn-outline px-4 py-1.5 text-sm"
              onClick={() => {
                setEditId(f.id)
                setForm({
                  name: f.name,
                  slug: f.slug,
                  description: f.description,
                  field_type: f.field_type,
                  address: f.address,
                  capacity: f.capacity,
                  features: f.features,
                  photos: f.photos,
                  is_active: f.is_active,
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
