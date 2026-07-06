"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type ButtonProps = {
  children: ReactNode
  variant?: "primary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md"
  href?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: "button" | "submit"
}

const btnVariants: Record<string, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
  ghost: "inline-flex items-center justify-center gap-2 px-4 py-2 text-muted transition hover:text-blaze",
  danger:
    "inline-flex items-center justify-center gap-2 border border-danger/60 bg-danger/10 px-6 py-3 text-danger transition hover:bg-danger hover:text-night",
}

export function Button(props: ButtonProps) {
  const cls = [
    btnVariants[props.variant ?? "primary"],
    props.size === "sm" ? "!px-4 !py-2 text-sm" : "",
    props.className ?? "",
  ].join(" ")

  if (props.href) {
    return (
      <Link href={props.href} className={cls}>
        {props.children}
      </Link>
    )
  }
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled} className={cls}>
      {props.children}
    </button>
  )
}

export function Card(props: { children: ReactNode; className?: string; crosshair?: boolean }) {
  return (
    <div className={["card", props.crosshair ? "crosshair-hover" : "", props.className ?? ""].join(" ")}>
      {props.children}
    </div>
  )
}

type BadgeTone = "neutral" | "blaze" | "neon" | "danger" | "sand"

const badgeTones: Record<BadgeTone, string> = {
  neutral: "badge bg-steel text-fog",
  blaze: "badge border border-blaze/40 bg-blaze/15 text-blaze",
  neon: "badge border border-neon/40 bg-neon/10 text-neon",
  danger: "badge border border-danger/40 bg-danger/10 text-danger",
  sand: "badge border border-sand/40 bg-sand/10 text-sand",
}

export function Badge(props: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={[badgeTones[props.tone ?? "neutral"], props.className ?? ""].join(" ")}>{props.children}</span>
}

export function SectionTitle(props: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-tick text-xl font-bold md:text-2xl">{props.title}</h2>
        {props.sub && <p className="mt-1.5 pr-4 text-sm text-muted">{props.sub}</p>}
      </div>
      {props.action}
    </div>
  )
}

export function Stat(props: { value: ReactNode; label: string }) {
  return (
    <div className="hud-frame bg-panel/60 px-5 py-4 text-center">
      <div className="text-2xl font-black text-blaze md:text-3xl">{props.value}</div>
      <div className="mt-1 text-xs text-muted">{props.label}</div>
    </div>
  )
}

export function Skeleton(props: { className?: string }) {
  return <div className={["animate-pulse bg-panel2", props.className ?? "h-4 w-full"].join(" ")} />
}

/** لودر رادار — برای حالت‌های در حال بارگذاری */
export function RadarLoader(props: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="relative h-14 w-14 rounded-full border border-olive/60">
        <div className="absolute inset-2 rounded-full border border-olive/20" />
        <div className="animate-radar absolute inset-0 origin-center">
          <div className="absolute left-1/2 top-0 h-1/2 w-px bg-gradient-to-b from-neon to-transparent" />
        </div>
        <div className="animate-pulse-dot absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon" />
      </div>
      {props.label && <div className="text-xs text-muted">{props.label}</div>}
    </div>
  )
}
