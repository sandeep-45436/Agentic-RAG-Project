"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PageTransitionProps extends React.ComponentProps<"div"> {
  variant?: "fade-up" | "fade" | "slide-right" | "scale"
}

function PageTransition({
  variant = "fade-up",
  className,
  children,
  ...props
}: PageTransitionProps) {
  const variantClass = {
    "fade-up": "animate-page-fade-up",
    fade: "animate-page-fade",
    "slide-right": "animate-page-slide-right",
    scale: "animate-page-scale",
  }[variant]

  return (
    <div
      data-slot="page-transition"
      className={cn(variantClass, "motion-reduce:animate-none", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { PageTransition }
export type { PageTransitionProps }
