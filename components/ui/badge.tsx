"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-blue-900/50 bg-blue-950/30 text-blue-400 hover:bg-blue-900/30",
        secondary:
          "border border-gray-800/50 bg-black text-gray-300 hover:bg-gray-900/50",
        destructive:
          "border border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-900/30",
        outline: "border border-gray-700 text-gray-300",
        success: 
          "border border-green-900/50 bg-green-950/30 text-green-400 hover:bg-green-900/30",
        warning:
          "border border-orange-900/50 bg-orange-950/30 text-orange-400 hover:bg-orange-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
