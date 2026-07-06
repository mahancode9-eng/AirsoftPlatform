"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function RulesPage() {
  const [rules, setRules] = useState("")

  useEffect(() => {
    api<{ rules: string }>("/site-info")
      .then((info) => setRules(info.rules))
      .catch(() => null)
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">قوانین و مقررات ایمنی</h1>
      <div className="card mt-6 whitespace-pre-line leading-8">
        {rules || "قوانین مجموعه به‌زودی در این بخش منتشر می‌شود."}
      </div>
    </div>
  )
}
