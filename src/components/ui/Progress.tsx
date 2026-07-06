import { motion } from 'framer-motion'
import { cn, clamp } from '@/lib/utils'

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  tone = 'primary',
}: {
  value: number
  max?: number
  className?: string
  barClassName?: string
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const pct = clamp((value / max) * 100, 0, 100)
  const toneClass = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[tone]
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <motion.div
        className={cn('h-full rounded-full', toneClass, barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}

export function Ring({
  value,
  max = 100,
  size = 64,
  stroke = 6,
  tone = 'hsl(var(--primary))',
  label,
  sublabel,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  tone?: string
  label?: string
  sublabel?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = clamp(value / max, 0, 1)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && <span className="text-sm font-bold tabular">{label}</span>}
          {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
        </div>
      )}
    </div>
  )
}
