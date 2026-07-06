import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plane, Stethoscope, User, GraduationCap, MoreHorizontal, Check, X, CalendarPlus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { LeaveRequest, LeaveType } from '@/data/types'
import { getEmployee } from '@/data/selectors'
import { cn } from '@/lib/utils'
import { shortDate } from '@/lib/dates'
import { Avatar, Badge, Button, Card, EmptyState, Ring, Segmented } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

type Tab = 'mine' | 'team' | 'new'

const TYPES: { value: LeaveType; label: string; icon: typeof Plane; color: string }[] = [
  { value: 'annual', label: 'Annual', icon: Plane, color: 'text-dept-floor' },
  { value: 'sick', label: 'Sick', icon: Stethoscope, color: 'text-danger' },
  { value: 'personal', label: 'Personal', icon: User, color: 'text-dept-bar' },
  { value: 'study', label: 'Study', icon: GraduationCap, color: 'text-dept-support' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-muted-foreground' },
]

const BALANCES = [
  { type: 'Annual', used: 6, total: 20, tone: 'primary' as const },
  { type: 'Sick', used: 2, total: 10, tone: 'danger' as const },
  { type: 'Personal', used: 1, total: 5, tone: 'warning' as const },
  { type: 'Study', used: 0, total: 4, tone: 'success' as const },
]

function daysBetween(a: string, b: string) {
  const d = (new Date(`${b}T00:00`).getTime() - new Date(`${a}T00:00`).getTime()) / 86400000
  return Math.max(1, Math.round(d) + 1)
}

export default function Leave() {
  const leaves = useStore((s) => s.leaves)
  const role = useStore((s) => s.role)
  const currentUserId = useStore((s) => s.currentUserId)
  const requestLeave = useStore((s) => s.requestLeave)
  const approveLeave = useStore((s) => s.approveLeave)
  const declineLeave = useStore((s) => s.declineLeave)

  const [tab, setTab] = useState<Tab>('mine')

  const mine = leaves.filter((l) => l.employeeId === currentUserId)
  const team = leaves.filter((l) => l.employeeId !== currentUserId)
  const teamPending = team.filter((l) => l.status === 'pending').length

  return (
    <PageShell>
      <PageHeader
        title="Leave"
        subtitle="Request time off and track your balances."
        actions={
          <Segmented
            options={[
              { value: 'mine', label: 'My leave' },
              ...(role !== 'employee' ? [{ value: 'team' as Tab, label: `Team${teamPending ? ` · ${teamPending}` : ''}` }] : []),
              { value: 'new', label: 'Request' },
            ]}
            value={tab}
            onChange={setTab}
            layoutId="leave-tab"
          />
        }
      />

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BALANCES.map((b) => (
          <Card key={b.type} className="flex items-center gap-3 p-4">
            <Ring value={b.total - b.used} max={b.total} size={54} stroke={6} label={String(b.total - b.used)} tone={`hsl(var(--${b.tone === 'primary' ? 'primary' : b.tone}))`} />
            <div>
              <p className="text-sm font-semibold">{b.type}</p>
              <p className="text-xs text-muted-foreground">{b.total - b.used} of {b.total} days left</p>
            </div>
          </Card>
        ))}
      </div>

      {tab === 'new' && <RequestForm onSubmit={(input) => { requestLeave(input); setTab('mine') }} />}

      {tab === 'mine' && (
        <div className="space-y-3">
          {mine.length ? mine.map((l) => <LeaveCard key={l.id} leave={l} />) : <EmptyState icon={CalendarPlus} title="No leave requests yet" description="Request time off from the Request tab." action={<Button className="mt-1" onClick={() => setTab('new')}>Request leave</Button>} />}
        </div>
      )}

      {tab === 'team' && (
        <div className="space-y-3">
          {team.length ? team.map((l) => <LeaveCard key={l.id} leave={l} showEmployee onApprove={() => approveLeave(l.id)} onDecline={() => declineLeave(l.id)} />) : <EmptyState icon={Plane} title="No team requests" />}
        </div>
      )}
    </PageShell>
  )
}

function typeMeta(t: LeaveType) {
  return TYPES.find((x) => x.value === t) ?? TYPES[4]
}

function LeaveCard({ leave, showEmployee, onApprove, onDecline }: { leave: LeaveRequest; showEmployee?: boolean; onApprove?: () => void; onDecline?: () => void }) {
  const m = typeMeta(leave.type)
  const emp = getEmployee(leave.employeeId)
  const tone = leave.status === 'approved' ? 'success' : leave.status === 'declined' ? 'danger' : 'warning'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {showEmployee && emp ? (
            <Avatar src={emp.avatar} name={emp.name} size="md" />
          ) : (
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-secondary', m.color)}><m.icon className="h-5 w-5" /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{showEmployee ? emp?.name : `${m.label} leave`}</p>
            <p className="text-xs text-muted-foreground">
              {showEmployee && `${m.label} · `}{shortDate(leave.start)}{leave.days > 1 ? ` – ${shortDate(leave.end)}` : ''} · {leave.days} {leave.days === 1 ? 'day' : 'days'}
            </p>
          </div>
          <Badge tone={tone}>{leave.status}</Badge>
        </div>
        {leave.reason && <p className="mt-2 rounded-lg bg-secondary/40 p-2.5 text-[13px] text-muted-foreground">{leave.reason}</p>}
        {leave.status === 'pending' && onApprove && (
          <div className="mt-3 flex gap-2">
            <Button variant="success" className="flex-1" onClick={onApprove}><Check className="h-4 w-4" /> Approve</Button>
            <Button variant="outline" className="flex-1" onClick={onDecline}><X className="h-4 w-4" /> Decline</Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function RequestForm({ onSubmit }: { onSubmit: (input: { type: LeaveType; start: string; end: string; reason: string; days: number }) => void }) {
  const [type, setType] = useState<LeaveType>('annual')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const valid = start && end && start <= end
  const days = valid ? daysBetween(start, end) : 0

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-[15px] font-semibold">New leave request</h3>
      <div className="mb-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button key={t.value} onClick={() => setType(t.value)} className={cn('inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors', type === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary/60')}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring" /></Field>
        <Field label="End date"><input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring" /></Field>
      </div>
      <div className="mt-3">
        <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Add a note for your manager…" className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm outline-none focus-ring" /></Field>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{valid ? <>Requesting <strong className="text-foreground">{days} {days === 1 ? 'day' : 'days'}</strong></> : 'Pick your dates'}</p>
        <Button disabled={!valid} onClick={() => onSubmit({ type, start, end, reason: reason || 'No reason provided', days })}>Submit request</Button>
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
