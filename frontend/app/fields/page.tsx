"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api, Field, FIELD_TYPE_FA } from "@/lib/api"

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Field[]>("/fields")
      .then(setFields)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">زمین‌های بازی</h1>
      <p className="mt-2 text-muted">مپ‌های متنوع برای هر سبک بازی — از جنگلی تا CQB سرپوشیده</p>
      {loading ? (
        <p className="mt-8 text-muted">در حال بارگذاری...</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {fields.map((f) => (
            <Link key={f.id} href={`/fields/${f.slug}`} className="card transition hover:border-army">
              {f.photos.length > 0 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.photos[0]} alt={f.name} className="mb-4 h-44 w-full rounded-lg object-cover" />
              )}
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{f.name}</div>
                <span className="badge bg-accentsoft text-accent">{FIELD_TYPE_FA[f.field_type] || f.field_type}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{f.description}</p>
              <div className="mt-3 text-sm text-muted">ظرفیت تا {f.capacity} نفر</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
