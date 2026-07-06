"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api, setToken } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api<{ access_token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ phone, full_name: fullName, password }),
      })
      setToken(res.access_token)
      router.push("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ثبت‌نام")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">ساخت حساب جدید</h1>
      <form onSubmit={submit} className="card mt-6 grid gap-4">
        <div>
          <label className="label">نام و نام خانوادگی</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="label">شماره موبایل</label>
          <input className="input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" required />
        </div>
        <div>
          <label className="label">رمز عبور (حداقل ۶ کاراکتر)</label>
          <input className="input" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
        </button>
        <p className="text-sm text-muted">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="text-accent hover:underline">وارد شوید</Link>
        </p>
      </form>
    </div>
  )
}
