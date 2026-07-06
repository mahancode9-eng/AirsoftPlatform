"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

const GATEWAY_FA: Record<string, string> = {
  zarinpal: "زرین‌پال",
  zibal: "زیبال",
  idpay: "آیدی‌پی",
  mock: "درگاه آزمایشی (Mock)",
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [gateways, setGateways] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const load = () => {
    api<{ settings: Record<string, string>; gateways: string[] }>("/admin/settings")
      .then((res) => {
        setSettings(res.settings)
        setGateways(res.gateways)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "خطا"))
  }

  useEffect(load, [])

  const set = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setMessage("")
    setError("")
    setSaving(true)
    try {
      await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      })
      setMessage("تنظیمات ذخیره شد.")
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا در ذخیره")
    } finally {
      setSaving(false)
    }
  }

  const field = (key: string, label: string, ltr = true, placeholder = "") => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        dir={ltr ? "ltr" : "rtl"}
        value={settings[key] ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  )

  return (
    <div>
      <h1 className="text-xl font-bold">تنظیمات و درگاه پرداخت</h1>
      <p className="mt-2 text-sm text-muted">
        درگاه فعال را انتخاب کنید و کلیدهای هر درگاه را جداگانه ذخیره کنید. مقادیر مخفی‌شده (ستاره‌دار) فقط در صورت تغییر، بازنویسی می‌شوند.
      </p>

      <div className="card mt-6">
        <div className="font-bold">درگاه فعال</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {gateways.map((g) => (
            <button
              key={g}
              onClick={() => set("payment.active_gateway", g)}
              className={
                "rounded-lg border px-4 py-3 text-sm transition " +
                (settings["payment.active_gateway"] === g
                  ? "border-army bg-army font-bold text-white"
                  : "border-line bg-white text-muted hover:border-army")
              }
            >
              {GATEWAY_FA[g] || g}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-4 grid gap-4">
        <div className="font-bold">زرین‌پال</div>
        {field("payment.zarinpal.merchant_id", "Merchant ID")}
        <div>
          <label className="label">حالت سندباکس (تست)</label>
          <select
            className="input"
            value={settings["payment.zarinpal.sandbox"] ?? "true"}
            onChange={(e) => set("payment.zarinpal.sandbox", e.target.value)}
          >
            <option value="true">فعال (تست)</option>
            <option value="false">غیرفعال (واقعی)</option>
          </select>
        </div>
      </div>

      <div className="card mt-4 grid gap-4">
        <div className="font-bold">زیبال</div>
        {field("payment.zibal.merchant", "Merchant", true, "برای تست: zibal")}
        <p className="text-xs text-muted">برای تست زیبال کافی است مقدار merchant را «zibal» قرار دهید.</p>
      </div>

      <div className="card mt-4 grid gap-4">
        <div className="font-bold">آیدی‌پی</div>
        {field("payment.idpay.api_key", "API Key")}
        <div>
          <label className="label">حالت سندباکس (تست)</label>
          <select
            className="input"
            value={settings["payment.idpay.sandbox"] ?? "true"}
            onChange={(e) => set("payment.idpay.sandbox", e.target.value)}
          >
            <option value="true">فعال (تست)</option>
            <option value="false">غیرفعال (واقعی)</option>
          </select>
        </div>
      </div>

      <div className="card mt-4 grid gap-4">
        <div className="font-bold">اطلاعات سایت</div>
        {field("site.name", "نام مجموعه", false)}
        {field("site.phone", "تلفن تماس")}
        {field("site.instagram", "لینک اینستاگرام")}
        {field("site.telegram", "لینک تلگرام")}
        <div>
          <label className="label">قوانین و مقررات (در صفحه قوانین و فرم ایمنی نمایش داده می‌شود)</label>
          <textarea
            className="input"
            rows={6}
            value={settings["site.rules"] ?? ""}
            onChange={(e) => set("site.rules", e.target.value)}
          />
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-positive">{message}</p>}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <button className="btn-primary mt-4" disabled={saving} onClick={save}>
        {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </button>
    </div>
  )
}
