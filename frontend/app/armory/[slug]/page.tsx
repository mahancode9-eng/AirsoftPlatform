"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api, fmtPrice } from "@/lib/api"
import { Badge, Button, Card, RadarLoader, SectionTitle } from "@/components/ui/core"
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion"
import { CATEGORY_FA, POWER_FA, SLOT_FA, STAT_FA, groupBySlot } from "@/lib/armory"
import type { GunDetail } from "@/lib/armory"

export default function GunDetailPage(props: { params: { slug: string } }) {
  const [gun, setGun] = useState<GunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    api<GunDetail>(`/guns/${props.params.slug}`)
      .then(setGun)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [props.params.slug])

  if (loading) {
    return (
      <div className="py-24">
        <RadarLoader label="در حال دریافت مشخصات گان..." />
      </div>
    )
  }

  if (!gun) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-4xl">🎯</div>
        <h1 className="mt-4 text-xl font-bold">گان پیدا نشد</h1>
        <p className="mt-2 text-muted">شاید حذف شده یا آدرس اشتباه است.</p>
        <div className="mt-6">
          <Button href="/armory" variant="outline">
            بازگشت به اسلحه‌خانه
          </Button>
        </div>
      </div>
    )
  }

  const photos = gun.photos || []
  const mainPhoto = photos[photoIdx] || photos[0] || ""
  const statEntries = Object.entries(gun.stats || Object())
  const slots = groupBySlot(gun.attachments || [])

  const specs: Array<[string, string]> = [
    ["دسته", CATEGORY_FA[gun.category] || gun.category],
    ["منبع قدرت", POWER_FA[gun.power_source] || gun.power_source],
    ["سرعت پرتاب", gun.fps > 0 ? gun.fps + " FPS" : "—"],
    ["وزن", gun.weight_grams > 0 ? (gun.weight_grams / 1000).toFixed(1) + " کیلوگرم" : "—"],
    ["طول", gun.length_mm > 0 ? gun.length_mm + " میلی‌متر" : "—"],
    ["ظرفیت خشاب", gun.magazine_capacity > 0 ? gun.magazine_capacity + " ساچمه" : "—"],
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <FadeIn>
        <div className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link href="/armory" className="transition hover:text-blaze">
            اسلحه‌خانه
          </Link>
          <span>/</span>
          <span className="text-fog">{gun.name}</span>
        </div>
      </FadeIn>

      <div className="grid gap-8 lg:grid-cols-2">
        <FadeIn>
          <div className="hud-frame relative flex h-72 items-center justify-center overflow-hidden border border-line bg-gradient-to-b from-panel2 to-night md:h-96">
            {mainPhoto ? (
              <img src={mainPhoto} alt={gun.name} className="max-h-full w-auto object-contain" />
            ) : (
              <span className="text-6xl">🔫</span>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((p, i) => {
                const cls = i === photoIdx ? "border-blaze" : "border-line hover:border-olive"
                return (
                  <button
                    key={p}
                    onClick={() => setPhotoIdx(i)}
                    className={"h-16 w-20 overflow-hidden border bg-panel transition " + cls}
                  >
                    <img src={p} alt="" className="h-full w-full object-contain" />
                  </button>
                )
              })}
            </div>
          )}
        </FadeIn>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blaze">{CATEGORY_FA[gun.category] || gun.category}</Badge>
            <Badge>{POWER_FA[gun.power_source] || gun.power_source}</Badge>
            {gun.stock > 0 ? <Badge tone="neon">موجود</Badge> : <Badge tone="danger">ناموجود</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{gun.name}</h1>
          {gun.brand && <div className="mt-1 font-mono text-sm text-muted">{gun.brand}</div>}
          {gun.description && <p className="mt-4 leading-8 text-muted">{gun.description}</p>}

          {statEntries.length > 0 && (
            <div className="mt-6 space-y-3">
              {statEntries.map(([key, value]) => {
                const pct = Math.max(0, Math.min(100, Number(value)))
                const barStyle = { width: pct + "%" }
                return (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted">{STAT_FA[key] || key}</span>
                      <span className="font-mono text-blaze">{pct}</span>
                    </div>
                    <div className="h-1.5 bg-steel">
                      <div className="h-full bg-blaze transition-all duration-700" style={barStyle} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {specs.map(([label, value]) => (
              <div key={label} className="border border-line bg-panel px-3 py-2.5">
                <div className="text-[11px] text-muted">{label}</div>
                <div className="mt-0.5 text-sm font-bold">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <div>
              <div className="text-xs text-muted">اجاره برای هر سانس</div>
              <div className="text-xl font-black text-blaze">{fmtPrice(gun.price_per_session)}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={`/loadout/${gun.slug}`}>🛠 ساخت لوداوت با این گان</Button>
            <Button href="/booking" variant="outline">
              رزرو سانس
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <SectionTitle
          title="اتچمنت‌های سازگار"
          sub="تجهیزاتی که می‌توانی روی این گان نصب کنی — در Loadout Builder انتخاب می‌شوند"
        />
        {slots.length === 0 ? (
          <Card className="text-center text-muted">اتچمنت سازگاری برای این گان ثبت نشده است.</Card>
        ) : (
          <div className="space-y-8">
            {slots.map(([slot, items]) => (
              <div key={slot}>
                <div className="section-tick mb-4 text-sm font-bold text-muted">{SLOT_FA[slot] || slot}</div>
                <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((a) => (
                    <StaggerItem key={a.id}>
                      <Card crosshair className="h-full">
                        <div className="flex h-20 items-center justify-center overflow-hidden bg-night/60">
                          {a.photo ? (
                            <img src={a.photo} alt={a.name} loading="lazy" className="max-h-16 w-auto object-contain" />
                          ) : (
                            <span className="text-2xl">🔩</span>
                          )}
                        </div>
                        <div className="mt-2 text-sm font-bold">{a.name}</div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted">{SLOT_FA[a.slot] || a.slot}</span>
                          <span className="font-bold text-blaze">{fmtPrice(a.price_per_session)}</span>
                        </div>
                      </Card>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
