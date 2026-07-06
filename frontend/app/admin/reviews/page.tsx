"use client"

import { useEffect, useState } from "react"
import { api, Review } from "@/lib/api"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState("")

  const load = () => api<Review[]>("/admin/reviews").then(setReviews).catch(() => null)
  useEffect(() => { load() }, [])

  const approve = async (id: number) => {
    try {
      await api(`/admin/reviews/${id}/approve`, { method: "POST" })
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  const remove = async (id: number) => {
    try {
      await api(`/admin/reviews/${id}`, { method: "DELETE" })
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت نظرات</h1>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-5 grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold">
                {r.user?.full_name || "کاربر"}{" "}
                <span className="text-sm text-army">{"★".repeat(r.rating)}</span>
              </div>
              <span className={"badge " + (r.is_approved ? "bg-green-50 text-positive" : "bg-accentsoft text-accent")}>
                {r.is_approved ? "تأیید شده" : "در انتظار تأیید"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{r.comment}</p>
            <div className="mt-3 flex gap-2">
              {!r.is_approved && (
                <button className="btn-primary px-4 py-1.5 text-sm" onClick={() => approve(r.id)}>تأیید</button>
              )}
              <button className="btn-outline px-4 py-1.5 text-sm text-danger" onClick={() => remove(r.id)}>حذف</button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-muted">نظری ثبت نشده است.</p>}
      </div>
    </div>
  )
}
