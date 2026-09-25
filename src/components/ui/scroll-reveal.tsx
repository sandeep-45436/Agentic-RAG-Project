"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "flip"

interface ScrollRevealProps extends React.ComponentProps<"div"> {
  direction?: RevealDirection
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
  staggerChildren?: number
}

const directionStyles: Record<RevealDirection, { from: string; to: string }> = {
  up: {
    from: "translate-y-8 opacity-0",
    to: "translate-y-0 opacity-100",
  },
  down: {
    from: "-translate-y-8 opacity-0",
    to: "translate-y-0 opacity-100",
  },
  left: {
    from: "translate-x-8 opacity-0",
    to: "translate-x-0 opacity-100",
  },
  right: {
    from: "-translate-x-8 opacity-0",
    to: "translate-x-0 opacity-100",
  },
  scale: {
    from: "scale-90 opacity-0",
    to: "scale-100 opacity-100",
  },
  flip: {
    from: "rotateX-12 opacity-0 scale-95",
    to: "rotateX-0 opacity-100 scale-100",
  },
}

function ScrollReveal({
  direction = "up",
  delay = 0,
  duration = 600,
  threshold = 0.15,
  once = true,
  staggerChildren,
  className,
  children,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(element)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, once])

  const styles = directionStyles[direction]

  return (
    <div
      ref={ref}
      data-slot="scroll-reveal"
      className={cn(
        "transition-all will-change-transform",
        isVisible ? styles.to : styles.from,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...props}
    >
      {staggerChildren
        ? React.Children.map(children, (child, index) => (
            <div
              className={cn(
                "transition-all",
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              )}
              style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay + index * staggerChildren}ms`,
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}

export { ScrollReveal }
export type { ScrollRevealProps, RevealDirection }
