import { useState } from 'react'
import { cn, initials } from '@/lib/utils'
import type { WorkStatus } from '@/data/types'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-3xl',
} as const

const STATUS_COLOR: Record<WorkStatus, string> = {
  working: 'bg-success',
  break: 'bg-warning',
  finished: 'bg-muted-foreground',
  scheduled: 'bg-primary',
  off: 'bg-muted-foreground/40',
}

interface AvatarProps {
  src?: string
  name: string
  size?: keyof typeof SIZES
  status?: WorkStatus
  ring?: boolean
  className?: string
}

export function Avatar({ src, name, size = 'md', status, ring, className }: AvatarProps) {
  const [error, setError] = useState(false)
  const dot = size === 'xs' || size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/80 to-purple-500 font-semibold text-white',
          SIZES[size],
          ring && 'ring-2 ring-background',
        )}
      >
        {src && !error ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setError(true)}
            className="h-full w-full object-cover drag-none"
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </span>
      {status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-card',
            dot,
            STATUS_COLOR[status],
            status === 'working' && 'animate-pulse-ring',
          )}
        />
      )}
    </span>
  )
}

export function AvatarStack({
  names,
  srcs,
  max = 4,
  size = 'sm',
}: {
  names: string[]
  srcs?: (string | undefined)[]
  max?: number
  size?: keyof typeof SIZES
}) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((n, i) => (
        <Avatar key={i} name={n} src={srcs?.[i]} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-background',
            SIZES[size],
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
