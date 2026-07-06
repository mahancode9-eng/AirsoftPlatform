"use client"

import { useEffect, useState } from "react"
import { api, fmtDate, fmtPrice, PaymentRecord } from "@/lib/api"

const KIND_FA: Record<string, string> = {
  booking: "رزرو",
  event: "بلیت رویداد",
  order: "سفارش فروشگاه",
}

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  paid: "موفق",
  failed: "ناموفق",
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  useEffect(() => {
    api<PaymentRecord[]>("/admin/payments").then(setPayments).catch(() => null)
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold">تراکنش‌های پرداخت</h1>
      <div className="card mt-5 overflow-x-auto p-0">
        {payments.length === 0 ? (
          <p className="p-5 text-muted">تراکنشی ثبت نشده است.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-right text-muted">
                <th className="p-3">تاریخ</th>
                <th className="p-3">نوع</th>
                <th className="p-3">مبلغ</th>
                <th className="p-3">درگاه</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">کد پیگیری</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="p-3">{fmtDate(p.created_at)}</td>
                  <td className="p-3">{KIND_FA[p.kind] || p.kind}</td>
                  <td className="p-3">{fmtPrice(p.amount)}</td>
                  <td className="p-3">{p.gateway}</td>
                  <td className="p-3">
                    <span
                      className={
                        "badge " +
                        (p.status === "paid"
                          ? "bg-green-50 text-positive"
                          : p.status === "failed"
                          ? "bg-red-50 text-danger"
                          : "bg-accentsoft text-accent")
                      }
                    >
                      {STATUS_FA[p.status] || p.status}
                    </span>
                  </td>
                  <td className="p-3" dir="ltr">{p.gateway_ref || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
