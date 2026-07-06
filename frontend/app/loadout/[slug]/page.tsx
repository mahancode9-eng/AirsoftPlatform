"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/core"
import type { GunDetail } from "@/lib/armory"

export default function LoadoutBuilderPage(props: { params: { slug: string } }) {
  const [gun, setGun] = useState<GunDetail | null>(null)

  useEffect(() => {
    api<GunDetail>(`/guns/${props.params.slug}`)
      .then(setGun)
      .catch(() => null)
  }, [props.params.slug])

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <div className="hud-frame border border-line bg-panel px-6 py-14">
        <div className="font-mono text-xs tracking-widest text-neon">LOADOUT BUILDER // UNDER CONSTRUCTION</div>
        <h1 className="mt-4 text-2xl font-black">🛠 لوداوت بیلدر به‌زودی</h1>
        <p className="mx-auto mt-4 max-w-md leading-8 text-muted">
          {gun ? "لوداوت «" + gun.name + "» را به‌زودی اینجا می‌سازی: " : ""}
          انتخاب اتچمنت برای هر اسلات، آمار زنده و رزرو مستقیم با لوداوت. (تسک ۶۳ — در حال ساخت)
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href={gun ? "/armory/" + gun.slug : "/armory"} variant="outline">
            بازگشت به اسلحه‌خانه
          </Button>
          <Button href="/booking">رزرو سانس</Button>
        </div>
      </div>
    </div>
  )
}
