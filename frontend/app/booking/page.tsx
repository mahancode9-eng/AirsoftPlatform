"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import {
  api,
  fmtDate,
  fmtPrice,
  getToken,
  Booking,
  Equipment,
  GameSession,
  SESSION_TYPE_FA,
} from "@/lib/api"

function BookingWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselect = searchParams.get("session")

  const [step, setStep] = useState(1)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [sessionId, setSessionId] = useState<number | null>(preselect ? Number(preselect) : null)
  const [numPlayers, setNumPlayers] = useState(1)
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [note, setNote] = useState("")
  const [equipQty, setEquipQty] = useState<Record<number, number>>({})
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // waiver
  const [waiverName, setWaiverName] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [acceptedRules, setAcceptedRules] = useState(false)

  useEffect(() => {
    api<GameSession[]>("/sessions?days=30").then(setSessions).catch(() => null)
    api<Equipment[]>("/equipment").then(setEquipment).catch(() => null)
  }, [])

  const selected = sessions.find((s) => s.id === sessionId) || null
  const equipTotal = equipment.reduce(
    (sum, item) => sum + (equipQty[item.id] || 0) * item.price_per_session,
    0
  )
  const total = (selected ? selected.price_per_player * numPlayers : 0) + equipTotal

  const createBooking = async () => {
    if (!getToken()) {
      router.push("/login")
      return
    }
    if (!sessionId) return
    setError("")
    setLoading(true)
    try {
      const eq = Object.entries(equipQty)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ equipment_id: Number(id), quantity: q }))
      const b = await api<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          num_players: numPlayers,
          is_group: isGroup,
          group_name: isGroup ? groupName : "",
          note,
          equipment: eq,
        }),
      })
      setBooking(b)
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا در ثبت رزرو")
    } finally {
      setLoading(false)
    }
  }

  const signWaiverAndPay = async () => {
    if (!booking) return
    setError("")
    setLoading(true)
    try {
      await api("/waivers", {
        method: "POST",
        body: JSON.stringify({
          booking_id: booking.id,
          full_name: waiverName,
          national_id: nationalId,
          emergency_phone: emergencyPhone,
          accepted_rules: acceptedRules,
        }),
      })
      if (booking.total_amount <= 0 || booking.status === "confirmed") {
        router.push(`/payment/result?status=success&kind=booking&code=${booking.code}`)
        return
      }
      const init = await api<{ payment_id: number; redirect_url: string }>("/payments/init", {
        method: "POST",
        body: JSON.stringify({ kind: "booking", ref_id: booking.id }),
      })
      window.location.href = init.redirect_url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">رزرو بازی</h1>
      <div className="mt-4 flex items-center gap-2 text-sm">
        {["انتخاب سانس", "نفرات و تجهیزات", "فرم ایمنی و پرداخت"].map((t, i) => (
          <div key={t} className="flex items-center gap-2">
            <span
              className={
                "flex h-7 w-7 items-center justify-center rounded-full text-xs " +
                (step >= i + 1 ? "bg-army text-white" : "bg-line text-muted")
              }
            >
              {i + 1}
            </span>
            <span className={step >= i + 1 ? "text-ink" : "text-muted"}>{t}</span>
            {i < 2 && <span className="mx-1 h-px w-6 bg-line" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-8 grid gap-3">
          {sessions.length === 0 && <p className="text-muted">سانس فعالی وجود ندارد.</p>}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSessionId(s.id)}
              className={
                "card flex flex-wrap items-center justify-between gap-3 text-right transition " +
                (sessionId === s.id ? "border-army ring-1 ring-army" : "hover:border-army")
              }
            >
              <div>
                <div className="font-bold">{s.title || s.field?.name}</div>
                <div className="mt-1 text-sm text-muted">
                  {s.field?.name} · {SESSION_TYPE_FA[s.session_type] || s.session_type}
                </div>
                <div className="mt-1 text-sm text-muted">{fmtDate(s.start_time)}</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-army">{fmtPrice(s.price_per_player)}</div>
                <div className="text-xs text-muted">ظرفیت باقی‌مانده: {s.remaining_capacity}</div>
              </div>
            </button>
          ))}
          <button className="btn-primary mt-3" disabled={!sessionId} onClick={() => setStep(2)}>
            ادامه
          </button>
        </div>
      )}

      {step === 2 && selected && (
        <div className="mt-8 grid gap-5">
          <div className="card">
            <div className="font-bold">{selected.title || selected.field?.name}</div>
            <div className="mt-1 text-sm text-muted">{fmtDate(selected.start_time)}</div>
          </div>
          <div className="card grid gap-4">
            <div>
              <label className="label">تعداد نفرات</label>
              <input
                type="number"
                min={1}
                max={selected.remaining_capacity || 1}
                className="input"
                value={numPlayers}
                onChange={(e) => setNumPlayers(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} />
              رزرو گروهی (تیم یا دورهمی)
            </label>
            {isGroup && (
              <div>
                <label className="label">نام گروه</label>
                <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">توضیحات (اختیاری)</label>
              <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="font-bold">اجاره تجهیزات (اختیاری)</div>
            <div className="mt-4 grid gap-3">
              {equipment.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-bold">{item.name}</div>
                    <div className="text-xs text-muted">{fmtPrice(item.price_per_session)} / سانس · موجودی: {item.stock}</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={item.stock}
                    className="input w-24"
                    value={equipQty[item.id] || 0}
                    onChange={(e) =>
                      setEquipQty((prev) => ({ ...prev, [item.id]: Math.max(0, Number(e.target.value)) }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <span className="font-bold">جمع کل</span>
            <span className="text-lg font-bold text-army">{fmtPrice(total)}</span>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <button className="btn-outline" onClick={() => setStep(1)}>بازگشت</button>
            <button className="btn-primary flex-1" disabled={loading} onClick={createBooking}>
              {loading ? "در حال ثبت..." : getToken() ? "ثبت رزرو و ادامه" : "برای ادامه وارد شوید"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && booking && (
        <div className="mt-8 grid gap-5">
          <div className="card bg-accentsoft">
            <div className="font-bold">رزرو شما ثبت شد — کد رهگیری: <span dir="ltr">{booking.code}</span></div>
            <p className="mt-1 text-sm text-muted">برای نهایی شدن، فرم ایمنی را تکمیل و پرداخت را انجام دهید.</p>
          </div>
          <div className="card grid gap-4">
            <div className="font-bold">فرم رضایت‌نامه و ایمنی</div>
            <div>
              <label className="label">نام کامل</label>
              <input className="input" value={waiverName} onChange={(e) => setWaiverName(e.target.value)} required />
            </div>
            <div>
              <label className="label">کد ملی</label>
              <input className="input" dir="ltr" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
            </div>
            <div>
              <label className="label">شماره تماس اضطراری</label>
              <input className="input" dir="ltr" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
            </div>
            <label className="flex items-start gap-2 text-sm leading-6">
              <input type="checkbox" className="mt-1" checked={acceptedRules} onChange={(e) => setAcceptedRules(e.target.checked)} />
              <span>
                قوانین ایمنی مجموعه را مطالعه کردم و می‌پذیرم. (<a href="/rules" target="_blank" className="text-accent hover:underline">مطالعه قوانین</a>)
              </span>
            </label>
          </div>
          <div className="card flex items-center justify-between">
            <span className="font-bold">مبلغ قابل پرداخت</span>
            <span className="text-lg font-bold text-army">{fmtPrice(booking.total_amount)}</span>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            className="btn-primary"
            disabled={loading || !acceptedRules || !waiverName || !nationalId || !emergencyPhone}
            onClick={signWaiverAndPay}
          >
            {loading ? "در حال انتقال به درگاه..." : "تکمیل و پرداخت"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-muted">در حال بارگذاری...</div>}>
      <BookingWizard />
    </Suspense>
  )
}
