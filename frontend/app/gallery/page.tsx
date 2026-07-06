"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface GalleryImage {
  id: number
  url: string
  caption: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<GalleryImage[]>("/gallery")
      .then(setImages)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">گالری تصاویر</h1>
      {loading ? (
        <p className="mt-8 text-muted">در حال بارگذاری...</p>
      ) : images.length === 0 ? (
        <p className="mt-8 text-muted">هنوز تصویری ثبت نشده است.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {images.map((img) => (
            <figure key={img.id} className="overflow-hidden rounded-xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption} className="h-56 w-full object-cover" />
              {img.caption && <figcaption className="p-3 text-sm text-muted">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
