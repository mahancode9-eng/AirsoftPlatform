"use client"

import { motion, useInView } from "framer-motion"
import type { Variants } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

const ease: [number, number, number, number] = [0.21, 0.7, 0.3, 1]

const viewportOnce = { once: true, margin: "-60px" } as const

/** ظاهر شدن نرم هنگام ورود به viewport */
export function FadeIn(props: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const hidden = { opacity: 0, y: props.y ?? 24 }
  const visible = { opacity: 1, y: 0 }
  const transition = { duration: 0.6, delay: props.delay ?? 0, ease }

  return (
    <motion.div
      className={props.className}
      initial={hidden}
      whileInView={visible}
      viewport={viewportOnce}
      transition={transition}
    >
      {props.children}
    </motion.div>
  )
}

/** ورود پلکانی آیتم‌ها — دور فرزندان StaggerItem بگذارید */
export function Stagger(props: { children: ReactNode; className?: string; delay?: number }) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: props.delay ?? 0 } },
  }

  return (
    <motion.div
      className={props.className}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      variants={variants}
    >
      {props.children}
    </motion.div>
  )
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

export function StaggerItem(props: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={props.className} variants={staggerItemVariants}>
      {props.children}
    </motion.div>
  )
}

/** شمارنده عددی با فرمت فارسی */
export function CountUp(props: { to: number; suffix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const dur = (props.duration ?? 1.6) * 1000
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1)
      setVal(Math.round(props.to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, props.to, props.duration])

  return (
    <span ref={ref} className={props.className}>
      {val.toLocaleString("fa-IR")}
      {props.suffix ?? ""}
    </span>
  )
}

/** افکت تایپ شدن متن (ترمینال نظامی) */
export function Typewriter(props: { text: string; className?: string; speed?: number; startDelay?: number }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const speed = props.speed ?? 55
    const step = (i: number) => {
      setN(i)
      if (i < props.text.length) id = setTimeout(() => step(i + 1), speed)
    }
    id = setTimeout(() => step(1), props.startDelay ?? 400)
    return () => clearTimeout(id)
  }, [props.text, props.speed, props.startDelay])

  return (
    <span className={props.className}>
      {props.text.slice(0, n)}
      <span className="animate-blink text-blaze">_</span>
    </span>
  )
}
