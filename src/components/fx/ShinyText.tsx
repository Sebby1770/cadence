import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Muted text with a light sweep passing across it. */
export function ShinyText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('shiny-text', className)}>{children}</span>
}
