"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Created custom Progress component to avoid build errors with @radix-ui/react-progress
const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => {
  // Ensure value is between 0-100
  const validValue = Math.max(0, Math.min(100, value || 0))
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={validValue}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - validValue}%)` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
