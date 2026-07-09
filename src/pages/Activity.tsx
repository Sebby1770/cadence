import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Move, UserCheck, Store, Undo2, Send, Repeat2, Plane, Sparkles, UserPlus,
  History, Copy, Check, ShieldCheck, type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getEmployee } from '@/data/selectors'
import { cn, relativeTime } from '@/lib/utils'
import type { AuditEntry } from '@/data/types'
import { Avatar, Card, EmptyState, Segmented } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

const META: Record<string, { icon: LucideIcon; tint: string }> = {
  'shift.move': { icon: Move, tint: 'bg-primary/12 text-primary' },
  'shift.assign': { icon: UserCheck, tint: 'bg-primary/12 text-primary' },
  'shift.pickup': { icon: Store, tint: 'bg-warning/15 text-warning' },
  'shift.release': { icon: Undo2, tint: 'bg-dept-floor/12 text-dept-floor' },
  'shift.publish': { icon: Send, tint: 'bg-success/12 text-success' },
  'swap.offer': { icon: Repeat2, tint: 'bg-dept-bar/12 text-dept-bar' },
  'swap.resolve': { icon: Repeat2, tint: 'bg-dept-bar/12 text-dept-bar' },
  'leave.request': { icon: Plane, tint: 'bg-dept-floor/12 text-dept-floor' },
  'leave.resolve': { icon: Plane, tint: 'bg-success/12 text-success' },
  'company.create': { icon: Sparkles, tint: 'bg-success/12 text-success' },
  'member.join': { icon: UserPlus, tint: 'bg-success/12 text-success' },
}

type Filter = 'all' | 'shift' | 'swap' | 'leave' | 'workspace'

export default function Activity() {
  const audit = useStore((s) => s.audit)
  const companies = useStore((s) => s.companies)
  const activeId = useStore((s) => s.activeCompanyId)
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState(false)
  const company = companies.find((c) => c.id === activeId)

  const rows = useMemo(() => {
    if (filter === 'all') return audit
    if (filter === 'workspace') return audit.filter((a) => a.action.startsWith('company') || a.action.startsWith('member'))
    return audit.filter((a) => a.action.startsWith(filter))
  }, [audit, filter])

  const copy = () => {
    if (!company) return
    navigator.clipboard?.writeText(company.joinCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <PageShell>
      <PageHeader
        title="Activity log"
        subtitle={company ? `Every schedule change across ${company.name}` : 'Audit trail of schedule changes'}
        actions={
          <Segmented
            options={[
              { value: 'all', label: 'All' },
              { value: 'shift', label: 'Shifts' },
              { value: 'swap', label: 'Swaps' },
              { value: 'leave', label: 'Leave' },
              { value: 'workspace', label: 'Workspace' },
            ]}
            value={filter}
            onChange={setFilter}
            size="sm"
            layoutId="activity-filter"
          />
        }
      />

      {company && (
        <Card className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Invite your team</p>
            <p className="text-xs text-muted-foreground">Share this code so teammates can join {company.name}.</p>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 font-mono text-sm font-bold tracking-widest transition-colors hover:bg-secondary"
          >
            {company.joinCode}
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
        </Card>
      )}

      <Card className="p-2 sm:p-3">
        {rows.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Schedule changes, swaps, and approvals will appear here as they happen." />
        ) : (
          <div className="relative space-y-1">
            <div className="absolute bottom-2 left-[27px] top-2 w-px bg-border" />
            {rows.map((entry, i) => (
              <Row key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  )
}

function Row({ entry, index }: { entry: AuditEntry; index: number }) {
  const meta = META[entry.action] ?? { icon: History, tint: 'bg-secondary text-muted-foreground' }
  const Icon = meta.icon
  const actor = getEmployee(entry.actorId)
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="relative flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-secondary/40"
    >
      <div className={cn('z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card', meta.tint)}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="font-medium">{entry.summary}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {actor?.name ?? 'System'} · {relativeTime(entry.createdAt)}
        </p>
      </div>
      {actor && <Avatar src={actor.avatar} name={actor.name} size="sm" />}
    </motion.div>
  )
}
