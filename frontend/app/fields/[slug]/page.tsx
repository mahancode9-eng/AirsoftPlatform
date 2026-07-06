"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  api,
  fmtDate,
  fmtPrice,
  getToken,
  Field,
  GameSession,
  Review,
  FIELD_TYPE_FA,
  SESSION_TYPE_FA,
} from "@/lib/api"

export default function FieldDetailPage() {
  const params = useParams<{ slug: string }>()
  const [field, setField] = useState<Field | null>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [message, setMessage] = useState("")
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!params?.slug) return
    api<Field>(`/fields/${params.slug}`)
      .then((f) => {
        setField(f)
        api<GameSession[]>(`/sessions?field_id=${f.id}&days=30`).then(setSessions).catch(() => null)
        api<Review[]>(`/fields/${f.id}/reviews`).then(setReviews).catch(() => null)
      })
      .catch(() => setNotFound(true))
  }, [params?.slug])

  const submitReview = async () => {
    if (!field) return
    setMessage("")
    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({ field_id: field.id, rating, comment }),
      })
      setComment("")
      setMessage("نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "خطا در ثبت نظر")
    }
  }

  if (notFound) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">زمین پیدا نشد.</div>
  if (!field) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">در حال بارگذاری...</div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{field.name}</h1>
        <span className="badge bg-accentsoft text-accent">{FIELD_TYPE_FA[field.field_type] || field.field_type}</span>
      </div>
      {field.photos.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {field.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt={field.name} className="h-52 w-full rounded-xl object-cover" />
          ))}
        </div>
      )}
      <p className="mt-5 max-w-3xl leading-8 text-ink">{field.description}</p>
      {field.address && <p className="mt-2 text-sm text-muted">آدرس: {field.address}</p>}

      <h2 className="mt-10 text-xl font-bold">سانس‌های این زمین</h2>
      {sessions.length === 0 ? (
        <p className="mt-3 text-muted">سانس فعالی برای این زمین ثبت نشده است.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {sessions.map((s) => (
            <div key={s.id} className="card">
              <div className="badge bg-accentsoft text-accent">{SESSION_TYPE_FA[s.session_type] || s.session_type}</div>
              <div className="mt-2 font-bold">{s.title || "سانس بازی"}</div>
              <div className="mt-1 text-sm text-muted">{fmtDate(s.start_time)}</div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-army">{fmtPrice(s.price_per_player)}</span>
                <span className="text-muted">ظرفیت: {s.remaining_capacity}</span>
              </div>
              <Link href={`/booking?session=${s.id}`} className="btn-primary mt-4 w-full text-sm">
                رزرو این سانس
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-xl font-bold">نظر بازیکن‌ها</h2>
      <div className="mt-4 grid gap-3">
        {reviews.length === 0 && <p className="text-muted">هنوز نظری ثبت نشده است.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <span className="font-bold">{r.user?.full_name || "کاربر"}</span>
              <span className="text-sm text-army">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{r.comment}</p>
          </div>
        ))}
      </div>

      {getToken() && (
        <div className="card mt-6 max-w-xl">
          <div className="font-bold">ثبت نظر</div>
          <label className="label mt-3">امتیاز</label>
          <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} ستاره</option>
            ))}
          </select>
          <label className="label mt-3">متن نظر</label>
          <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-primary mt-4" onClick={submitReview}>ارسال نظر</button>
          {message && <p className="mt-3 text-sm text-positive">{message}</p>}
        </div>
      )}
    </div>
  )
}
