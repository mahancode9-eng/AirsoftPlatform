"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ResultContent() {
  const params = useSearchParams()
  const status = params.get("status")
  const code = params.get("code")
  const track = params.get("track")
  const success = status === "success"

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="text-6xl">{success ? "✅" : "❌"}</div>
      <h1 className="mt-5 text-2xl font-bold">
        {success ? "پرداخت موفق بود!" : "پرداخت ناموفق بود"}
      </h1>
      <p className="mt-3 leading-7 text-muted">
        {success
          ? "رزرو/خرید شما با موفقیت ثبت شد. جزئیات در حساب کاربری شما قابل مشاهده است."
          : "پرداخت انجام نشد. می‌توانید از حساب کاربری دوباره تلاش کنید."}
      </p>
      {code && (
        <p className="mt-3 text-sm text-muted">
          کد رهگیری: <span className="font-bold text-ink" dir="ltr">{code}</span>
        </p>
      )}
      {track && (
        <p className="mt-1 text-sm text-muted">
          کد پیگیری پرداخت: <span className="font-bold text-ink" dir="ltr">{track}</span>
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/profile" className="btn-primary">حساب کاربری</Link>
        <Link href="/" className="btn-outline">صفحه اصلی</Link>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">در حال بارگذاری...</div>}>
      <ResultContent />
    </Suspense>
  )
}
