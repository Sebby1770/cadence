import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { DeptKey, WorkStatus } from '@/data/types'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-secondary text-secondary-foreground',
  primary: 'bg-accent text-accent-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-dept-floor/12 text-dept-floor',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}

const DEPT_CLASS: Record<DeptKey, string> = {
  floor: 'bg-dept-floor',
  kitchen: 'bg-dept-kitchen',
  bar: 'bg-dept-bar',
  sales: 'bg-dept-sales',
  support: 'bg-dept-support',
  management: 'bg-dept-management',
}

export function DeptDot({ dept, className }: { dept: DeptKey; className?: string }) {
  return <span className={cn('h-2 w-2 shrink-0 rounded-full', DEPT_CLASS[dept], className)} />
}

const STATUS_META: Record<WorkStatus, { label: string; dot: string; text: string }> = {
  working: { label: 'Working', dot: 'bg-success', text: 'text-success' },
  break: { label: 'On break', dot: 'bg-warning', text: 'text-warning' },
  finished: { label: 'Finished', dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
  scheduled: { label: 'Scheduled', dot: 'bg-primary', text: 'text-primary' },
  off: { label: 'Off', dot: 'bg-muted-foreground/50', text: 'text-muted-foreground' },
}

export function StatusPill({ status, className }: { status: WorkStatus; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', m.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot, status === 'working' && 'animate-pulse-ring')} />
      {m.label}
    </span>
  )
}
