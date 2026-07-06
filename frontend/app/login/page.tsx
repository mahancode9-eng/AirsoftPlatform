"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api, setToken } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      })
      setToken(res.access_token)
      router.push("/")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ورود")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">ورود به حساب</h1>
      <form onSubmit={submit} className="card mt-6 grid gap-4">
        <div>
          <label className="label">شماره موبایل</label>
          <input className="input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" required />
        </div>
        <div>
          <label className="label">رمز عبور</label>
          <input className="input" dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? "در حال ورود..." : "ورود"}
        </button>
        <p className="text-sm text-muted">
          حساب ندارید؟{" "}
          <Link href="/register" className="text-accent hover:underline">ثبت‌نام کنید</Link>
        </p>
      </form>
    </div>
  )
}
