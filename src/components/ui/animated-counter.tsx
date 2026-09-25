"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps extends React.ComponentProps<"span"> {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

function AnimatedCounter({
  value,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  ...props
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  const [hasAnimated, setHasAnimated] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReducedMotion) {
      setDisplayValue(value)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          animateValue(0, value, duration)
          observer.unobserve(element)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [value, duration, hasAnimated])

  const animateValue = (start: number, end: number, dur: number) => {
    const startTime = performance.now()

    const easeOutExpo = (t: number) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / dur, 1)
      const easedProgress = easeOutExpo(progress)
      const current = start + (end - start) * easedProgress

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        setDisplayValue(end)
      }
    }

    requestAnimationFrame(tick)
  }

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString()

  return (
    <span
      ref={ref}
      data-slot="animated-counter"
      className={cn("tabular-nums", className)}
      {...props}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

export { AnimatedCounter }
export type { AnimatedCounterProps }
