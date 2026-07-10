import { cn, initials, seededRandom } from '@/lib/utils'
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

/*
 * Deterministic gradient per person (Linear/Notion-style initials avatars).
 * No network fetches, no mismatched stock photos, always crisp — the same
 * name maps to the same gradient everywhere in the app.
 */
const PALETTES = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-indigo-400',
  'from-teal-500 to-emerald-500',
] as const

const paletteFor = (name: string) => PALETTES[Math.floor(seededRandom(name) * PALETTES.length)]

interface AvatarProps {
  /** Accepted for API compatibility; photos are intentionally not rendered. */
  src?: string
  name: string
  size?: keyof typeof SIZES
  status?: WorkStatus
  ring?: boolean
  className?: string
}

export function Avatar({ name, size = 'md', status, ring, className }: AvatarProps) {
  const dot = size === 'xs' || size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white',
          paletteFor(name),
          SIZES[size],
          ring && 'ring-2 ring-background',
        )}
      >
        <span className="drag-none">{initials(name)}</span>
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
  srcs: _srcs,
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
        <Avatar key={i} name={n} size={size} ring />
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
