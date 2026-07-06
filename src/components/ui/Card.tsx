import { forwardRef, type HTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { hover?: boolean }>(
  ({ className, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground shadow-card',
        hover && 'transition-all duration-200 ease-spring hover:shadow-elevated hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export function MotionCard({ className, hover, ...props }: HTMLMotionProps<'div'> & { hover?: boolean }) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-elevated',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between gap-3 p-5 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[15px] font-semibold tracking-tight', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-[11px] font-semibold uppercase tracking-wider text-muted-foreground', className)}
      {...props}
    />
  )
}
