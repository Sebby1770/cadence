import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Text with an animated, panning gradient fill. */
export function GradientText({
  children,
  className,
  gradient = 'linear-gradient(110deg, hsl(var(--primary)), #8b5cf6, #06b6d4, hsl(var(--primary)))',
}: {
  children: ReactNode
  className?: string
  gradient?: string
}) {
  return (
    <span className={cn('gradient-text-anim', className)} style={{ backgroundImage: gradient }}>
      {children}
    </span>
  )
}
