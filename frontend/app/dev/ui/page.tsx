"use client"

import { Badge, Button, Card, RadarLoader, SectionTitle, Skeleton, Stat } from "@/components/ui/core"
import { CountUp, FadeIn, Stagger, StaggerItem, Typewriter } from "@/components/ui/motion"

const colors = [
  { name: "night", cls: "bg-night" },
  { name: "panel", cls: "bg-panel" },
  { name: "panel2", cls: "bg-panel2" },
  { name: "steel", cls: "bg-steel" },
  { name: "olive", cls: "bg-olive" },
  { name: "blaze", cls: "bg-blaze" },
  { name: "neon", cls: "bg-neon" },
  { name: "sand", cls: "bg-sand" },
  { name: "fog", cls: "bg-fog" },
]

export default function UiKitPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
      <div>
        <h1 className="text-2xl font-black md:text-3xl">
          <Typewriter text="دیزاین‌سیستم تاکتیکال // مرجع UI" />
        </h1>
        <p className="mt-3 text-muted">این صفحه مرجع بصری همه کامپوننت‌ها، رنگ‌ها و انیمیشن‌های پروژه است.</p>
      </div>

      <section>
        <SectionTitle title="پالت رنگ" sub="توکن‌های tailwind.config.ts" />
        <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
          {colors.map((c) => (
            <div key={c.name} className="text-center">
              <div className={`h-14 border border-line ${c.cls}`} />
              <div className="mt-1.5 font-mono text-xs text-muted">{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="دکمه‌ها" />
        <div className="flex flex-wrap items-center gap-4">
          <Button>رزرو سانس</Button>
          <Button variant="outline">مشاهده زمین‌ها</Button>
          <Button variant="danger">لغو رزرو</Button>
          <Button variant="ghost">بیشتر</Button>
          <Button size="sm">سایز کوچک</Button>
          <Button disabled>غیرفعال</Button>
        </div>
      </section>

      <section>
        <SectionTitle title="بج‌ها" sub="برای نوع سانس، وضعیت و مود بازی" />
        <div className="flex flex-wrap gap-3">
          <Badge>عادی</Badge>
          <Badge tone="blaze">VIP</Badge>
          <Badge tone="neon">🌙 سانس شبانه</Badge>
          <Badge tone="danger">💰 شرط‌بندی</Badge>
          <Badge tone="sand">🔑 اجاره‌ای</Badge>
        </div>
      </section>

      <section>
        <SectionTitle title="کارت‌ها" sub="hover کنید — بوردر، سطح و crosshair تغییر می‌کند" />
        <Stagger className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <Card crosshair>
              <Badge tone="blaze">Team Deathmatch</Badge>
              <div className="mt-3 font-bold">سانس اردویی صبح</div>
              <div className="mt-1 text-sm text-muted">۸:۰۰ تا ۹:۳۰ — زمین CQB</div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card crosshair>
              <Badge tone="neon">Night Vision</Badge>
              <div className="mt-3 font-bold text-glow-neon">سانس شبانه</div>
              <div className="mt-1 text-sm text-muted">۲۳:۰۰ تا ۱:۰۰ — دید در شب</div>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card crosshair className="hud-frame">
              <Badge tone="danger">Wager Match</Badge>
              <div className="mt-3 font-bold">دوئل شرطی</div>
              <div className="mt-1 text-sm text-muted">۲۱:۳۰ تا ۲۳:۰۰ — با براکت HUD</div>
            </Card>
          </StaggerItem>
        </Stagger>
      </section>

      <section>
        <SectionTitle title="آمار و شمارنده" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat value={<CountUp to={2400} suffix="+" />} label="بازیکن فعال" />
          <Stat value={<CountUp to={70} />} label="سانس در هفته" />
          <Stat value={<CountUp to={18} />} label="مود بازی" />
          <Stat value={<CountUp to={12} suffix="+" />} label="گان قابل اجاره" />
        </div>
      </section>

      <section>
        <SectionTitle title="انیمیشن‌های ورود" sub="FadeIn و Stagger" />
        <FadeIn>
          <Card>
            <div className="font-bold">FadeIn</div>
            <div className="mt-1 text-sm text-muted">این کارت هنگام ورود به viewport ظاهر می‌شود.</div>
          </Card>
        </FadeIn>
      </section>

      <section>
        <SectionTitle title="لودر و اسکلتون" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <RadarLoader label="در حال اسکن منطقه..." />
          </Card>
          <Card>
            <Skeleton className="h-5 w-2/3" />
            <div className="mt-3" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle title="افکت‌های ویژه" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="font-bold text-glow-blaze">متن با درخشش نارنجی</div>
            <div className="mt-2 font-bold text-glow-neon text-neon">متن با درخشش نئون</div>
          </Card>
          <Card>
            <div className="animate-flicker font-bold">فلیکر نور (هر ۴ ثانیه)</div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-neon" />
              وضعیت آنلاین
            </div>
          </Card>
          <div className="hazard-stripes flex items-center justify-center p-1">
            <div className="w-full bg-night p-5 text-center text-sm">نوار خطر (hazard)</div>
          </div>
        </div>
      </section>
    </div>
  )
}
