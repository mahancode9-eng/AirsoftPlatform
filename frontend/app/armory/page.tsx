"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { api, fmtPrice } from "@/lib/api"
import { Badge, Card, RadarLoader } from "@/components/ui/core"
import { FadeIn, Stagger, StaggerItem, Typewriter } from "@/components/ui/motion"
import { CATEGORY_FA, POWER_FA, gunPhoto } from "@/lib/armory"
import type { Gun } from "@/lib/armory"

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "همه" },
  { key: "rifle", label: "رایفل" },
  { key: "smg", label: "اس‌ام‌جی" },
  { key: "sniper", label: "اسنایپر" },
  { key: "shotgun", label: "شاتگان" },
  { key: "pistol", label: "پیستول" },
]

export default function ArmoryPage() {
  const [guns, setGuns] = useState<Gun[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState("all")

  useEffect(() => {
    api<Gun[]>("/guns")
      .then(setGuns)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (cat === "all" ? guns : guns.filter((g) => g.category === cat)),
    [guns, cat],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <FadeIn>
        <div className="mb-2 font-mono text-xs tracking-widest text-neon">ARMORY // WEAPON SELECT</div>
      </FadeIn>
      <h1 className="text-2xl font-black md:text-4xl">
        <Typewriter text="اسلحه‌خانه" />
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-muted">
        گان مورد نظرت را انتخاب کن، مشخصات و آمارش را ببین و با تجهیزات دلخواه لوداوت بساز. همه گان‌ها
        همراه سانس قابل اجاره هستند.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = cat === f.key
          const cls = active
            ? "badge border border-blaze bg-blaze/20 text-blaze"
            : "badge border border-line bg-panel text-muted transition hover:border-olive hover:text-fog"
          return (
            <button key={f.key} onClick={() => setCat(f.key)} className={cls}>
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        {loading ? (
          <RadarLoader label="در حال بارگذاری اسلحه‌خانه..." />
        ) : filtered.length === 0 ? (
          <Card className="text-center text-muted">
            گانی ثبت نشده است. (بعد از اجرای سیدر و اسکریپت عکس‌ها، گان‌ها اینجا نمایش داده می‌شوند)
          </Card>
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <StaggerItem key={g.id}>
                <Link href={`/armory/${g.slug}`} className="block">
                  <Card crosshair className="h-full">
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-b from-panel2 to-night">
                      {gunPhoto(g) ? (
                        <img
                          src={gunPhoto(g)}
                          alt={g.name}
                          loading="lazy"
                          className="max-h-36 w-auto object-contain transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <span className="text-4xl">🔫</span>
                      )}
                      {g.is_featured && (
                        <span className="badge absolute left-2 top-2 border border-neon/40 bg-night/80 text-neon">
                          پیشنهاد ویژه
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{g.name}</div>
                        {g.brand && <div className="mt-0.5 font-mono text-xs text-muted">{g.brand}</div>}
                      </div>
                      <Badge tone="blaze">{CATEGORY_FA[g.category] || g.category}</Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                      <span className="font-mono text-xs text-muted">
                        {POWER_FA[g.power_source] || g.power_source}
                        {g.fps > 0 ? " • " + g.fps + " FPS" : ""}
                      </span>
                      <span className="font-bold text-blaze">{fmtPrice(g.price_per_session)}</span>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  )
}
