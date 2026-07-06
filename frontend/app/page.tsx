"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api, fmtPrice, fmtDate, GameSession, EventItem, SESSION_TYPE_FA } from "@/lib/api"
import { Badge, Button, Card, RadarLoader, SectionTitle, Stat } from "@/components/ui/core"
import { CountUp, FadeIn, Stagger, StaggerItem, Typewriter } from "@/components/ui/motion"

const GAME_MODES = [
  { icon: "⚔️", en: "Team Deathmatch", fa: "نبرد تیمی" },
  { icon: "🚩", en: "Capture the Flag", fa: "تصاحب پرچم" },
  { icon: "💣", en: "Search & Destroy", fa: "بمب و خنثی" },
  { icon: "🧟", en: "Zombie", fa: "زامبی" },
  { icon: "👑", en: "Mini Royale", fa: "مینی رویال" },
  { icon: "💰", en: "Wager Match", fa: "دوئل شرطی" },
  { icon: "🌙", en: "Night Vision", fa: "سانس شبانه" },
  { icon: "🏚️", en: "CQB", fa: "نبرد نزدیک" },
]

const FEATURES = [
  { icon: "🎯", title: "رزرو آنلاین سانس", desc: "ظرفیت لحظه‌ای، پرداخت امن و بلیت QR" },
  { icon: "🔫", title: "گان و لوداوت", desc: "گان را انتخاب کن و تجهیزاتش را خودت بچین" },
  { icon: "🏆", title: "لیگ و مسابقات", desc: "تیم بساز، امتیاز بگیر و در جدول بالا برو" },
  { icon: "🌙", title: "سانس شبانه", desc: "نبرد با دید در شب — تجربه‌ای متفاوت" },
]

export default function HomePage() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<GameSession[]>("/sessions?days=7")
      .then((s) => setSessions(s.slice(0, 4)))
      .catch(() => null)
      .finally(() => setLoading(false))
    api<EventItem[]>("/events")
      .then((e) => setEvents(e.slice(0, 3)))
      .catch(() => null)
  }, [])

  return (
    <div>
      {/* ————— Hero ————— */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        {/* لایه‌های اتمسفر (تا رسیدن عکس‌های واقعی تسک ۶۱) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_20%,rgba(92,112,66,0.28),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_80%,rgba(255,122,26,0.10),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-night to-transparent" />
          <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full border border-olive/20" />
          <div className="absolute -left-8 top-1/3 h-40 w-40 rounded-full border border-olive/10" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-20">
          <FadeIn>
            <div className="mb-5 flex items-center gap-2 font-mono text-xs tracking-widest text-neon">
              <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-neon" />
              COMBAT ZONE // ACTIVE
            </div>
          </FadeIn>

          <h1 className="max-w-3xl text-3xl font-black leading-relaxed md:text-6xl md:leading-tight">
            <Typewriter text="وارد میدان نبرد شو." speed={70} />
          </h1>

          <FadeIn delay={1.6}>
            <p className="mt-6 max-w-xl leading-8 text-muted">
              سانس بازی را آنلاین رزرو کن، گان و تجهیزاتت را مثل بازی‌های تاکتیکال خودت بچین و با تیمت وارد
              لیگ شو. از نبرد تیمی تا زامبی و سانس شبانه با دید در شب.
            </p>
          </FadeIn>

          <FadeIn delay={1.9}>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/booking">🎯 رزرو سانس</Button>
              <Button href="/fields" variant="outline">
                مشاهده زمین‌ها
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={2.2}>
            <div className="mt-16 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
              <Stat value={<CountUp to={2400} suffix="+" />} label="بازیکن" />
              <Stat value={<CountUp to={70} />} label="سانس در هفته" />
              <Stat value={<CountUp to={18} />} label="مود بازی" />
              <Stat value={<CountUp to={12} suffix="+" />} label="گان قابل اجاره" />
            </div>
          </FadeIn>
        </div>

        {/* نوار خطر پایین هرو */}
        <div className="hazard-stripes absolute bottom-0 left-0 right-0 h-1.5 opacity-60" />
      </section>

      {/* ————— سانس‌های پیش رو ————— */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle
          title="سانس‌های پیش رو"
          sub="برنامه ۷ روز آینده — همین حالا جای خودت را رزرو کن"
          action={
            <Link href="/booking" className="text-sm text-blaze transition hover:text-neon">
              مشاهده همه ←
            </Link>
          }
        />
        {loading ? (
          <RadarLoader label="در حال دریافت سانس‌ها..." />
        ) : sessions.length === 0 ? (
          <Card className="text-center text-muted">فعلاً سانسی ثبت نشده است.</Card>
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sessions.map((s) => (
              <StaggerItem key={s.id}>
                <Link href={`/booking?session=${s.id}`} className="block">
                  <Card crosshair className="h-full">
                    <Badge tone="blaze">{SESSION_TYPE_FA[s.session_type] || s.session_type}</Badge>
                    <div className="mt-3 font-bold">{s.title || s.field?.name}</div>
                    <div className="mt-1 text-sm text-muted">{s.field?.name}</div>
                    <div className="mt-2 font-mono text-xs text-muted">{fmtDate(s.start_time)}</div>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                      <span className="font-bold text-blaze">{fmtPrice(s.price_per_player)}</span>
                      <span className="text-muted">ظرفیت: {s.remaining_capacity}</span>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      {/* ————— مودهای بازی ————— */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle title="مودهای بازی" sub="از نبرد تیمی کلاسیک تا زامبی و دوئل شرطی" />
          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {GAME_MODES.map((m) => (
              <StaggerItem key={m.en}>
                <Card crosshair className="text-center">
                  <div className="text-3xl">{m.icon}</div>
                  <div className="mt-2 font-bold">{m.fa}</div>
                  <div className="mt-1 font-mono text-[11px] tracking-wide text-muted">{m.en}</div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ————— امکانات ————— */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle title="چرا باشگاه ما؟" />
        <Stagger className="grid gap-4 md:grid-cols-4">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <Card className="h-full text-center">
                <div className="text-3xl">{f.icon}</div>
                <div className="mt-3 font-bold">{f.title}</div>
                <p className="mt-2 text-sm leading-6 text-muted">{f.desc}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ————— رویدادها ————— */}
      {events.length > 0 && (
        <section className="border-t border-line bg-panel/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <SectionTitle
              title="رویدادهای ویژه"
              action={
                <Link href="/events" className="text-sm text-blaze transition hover:text-neon">
                  مشاهده همه ←
                </Link>
              }
            />
            <Stagger className="grid gap-4 md:grid-cols-3">
              {events.map((e) => (
                <StaggerItem key={e.id}>
                  <Link href={`/events/${e.id}`} className="block">
                    <Card crosshair className="h-full">
                      <div className="font-bold">{e.title}</div>
                      <div className="mt-2 font-mono text-xs text-muted">{fmtDate(e.start_time)}</div>
                      <div className="mt-4 border-t border-line pt-3 text-sm font-bold text-blaze">
                        {fmtPrice(e.ticket_price)}
                      </div>
                    </Card>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ————— CTA پایانی ————— */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <FadeIn>
          <div className="hud-frame border border-line bg-panel px-6 py-12 text-center md:px-12">
            <div className="font-mono text-xs tracking-widest text-neon">MISSION BRIEFING</div>
            <h2 className="mt-4 text-2xl font-black md:text-4xl">آماده‌ای وارد عملیات بشی؟</h2>
            <p className="mx-auto mt-4 max-w-lg leading-8 text-muted">
              همین حالا سانس بعدی را رزرو کن. تجهیزات کامل برای تازه‌کارها موجوده — فقط خودت را برسون.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button href="/booking">شروع عملیات</Button>
              <Button href="/rules" variant="outline">
                قوانین میدان
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
