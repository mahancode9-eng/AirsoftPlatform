"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface GalleryImage {
  id: number
  url: string
  caption: string
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [caption, setCaption] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  const load = () => api<GalleryImage[]>("/gallery").then(setImages).catch(() => null)
  useEffect(() => { load() }, [])

  const upload = async (file: File) => {
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await api<{ url: string }>("/admin/upload", { method: "POST", body: fd })
      setUrl(res.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا در آپلود")
    } finally {
      setUploading(false)
    }
  }

  const add = async () => {
    setError("")
    try {
      await api("/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ url, caption }),
      })
      setUrl("")
      setCaption("")
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  const remove = async (id: number) => {
    try {
      await api(`/admin/gallery/${id}`, { method: "DELETE" })
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت گالری</h1>

      <div className="card mt-5 grid gap-3">
        <div className="font-bold">تصویر جدید</div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {uploading && <span className="text-sm text-muted">در حال آپلود...</span>}
        </div>
        <div>
          <label className="label">یا آدرس تصویر</label>
          <input className="input" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div>
          <label className="label">توضیح (اختیاری)</label>
          <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={!url} onClick={add}>افزودن به گالری</button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {images.map((img) => (
          <div key={img.id} className="overflow-hidden rounded-xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption} className="h-44 w-full object-cover" />
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-muted">{img.caption || "—"}</span>
              <button className="text-sm text-danger" onClick={() => remove(img.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
