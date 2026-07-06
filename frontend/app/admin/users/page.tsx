"use client"

import { useEffect, useState } from "react"
import { api, User } from "@/lib/api"

const ROLE_FA: Record<string, string> = {
  admin: "مدیر کل",
  staff: "کارکنان",
  player: "بازیکن",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const load = () => api<User[]>("/admin/users").then(setUsers).catch(() => null)
  useEffect(() => { load() }, [])

  const setRole = async (id: number, role: string) => {
    setError("")
    setMessage("")
    try {
      await api(`/admin/users/${id}/role?role=${role}`, { method: "POST" })
      setMessage("نقش کاربر به‌روز شد.")
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا")
    }
  }

  const filtered = users.filter(
    (u) =>
      !query ||
      u.full_name.includes(query) ||
      u.phone.includes(query)
  )

  return (
    <div>
      <h1 className="text-xl font-bold">مدیریت کاربران</h1>
      <input
        className="input mt-4 max-w-sm"
        placeholder="جستجو با نام یا شماره..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {message && <p className="mt-3 text-sm text-positive">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="card mt-5 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-right text-muted">
              <th className="p-3">نام</th>
              <th className="p-3">موبایل</th>
              <th className="p-3">نقش</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="p-3 font-bold">{u.full_name}</td>
                <td className="p-3" dir="ltr">{u.phone}</td>
                <td className="p-3">
                  <select className="input w-auto py-1 text-sm" value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                    {Object.entries(ROLE_FA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">تغییر نقش فقط توسط مدیر کل امکان‌پذیر است.</p>
    </div>
  )
}
