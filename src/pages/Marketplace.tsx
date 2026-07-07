import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Navigation, Clock, Sparkles, Store, MessageSquare, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DEPARTMENTS, LOCATIONS } from '@/data/mock'
import type { DeptKey, Shift } from '@/data/types'
import {
  departmentKey,
  departmentName,
  getEmployee,
  locationName,
  locationShort,
  openShifts,
  positionName,
  shiftHours,
  shiftPay,
} from '@/data/selectors'
import { cn, currency, minutesToLabel } from '@/lib/utils'
import { fullDate, iso } from '@/lib/dates'
import { Avatar, Badge, Button, Card, DeptDot, EmptyState, Modal, Segmented } from '@/components/ui'
import { CountUp, Tilt, SpotlightCard } from '@/components/fx'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

type Sort = 'soon' | 'pay' | 'near'

export default function Marketplace() {
  const shifts = useStore((s) => s.shifts)
  const currentUserId = useStore((s) => s.currentUserId)
  const me = getEmployee(currentUserId)!
  const pickUpShift = useStore((s) => s.pickUpShift)
  const addToast = useStore((s) => s.addToast)

  const [q, setQ] = useState('')
  const [dept, setDept] = useState<'all' | DeptKey>('all')
  const [loc, setLoc] = useState<'all' | string>('all')
  const [sort, setSort] = useState<Sort>('soon')
  const [detail, setDetail] = useState<Shift | null>(null)
  const [claimed, setClaimed] = useState<Set<string>>(new Set())

  const todayIso = iso(new Date())
  const open = openShifts(shifts).filter((s) => s.date >= todayIso)

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    let list = open.filter(
      (s) =>
        (dept === 'all' || departmentKey(s.departmentId) === dept) &&
        (loc === 'all' || s.locationId === loc) &&
        (!ql ||
          positionName(s.positionId).toLowerCase().includes(ql) ||
          locationName(s.locationId).toLowerCase().includes(ql) ||
          s.requiredSkills.some((k) => k.toLowerCase().includes(ql))),
    )
    list = [...list].sort((a, b) => {
      if (sort === 'pay') return shiftPay(b) - shiftPay(a)
      if (sort === 'near') return (a.distanceMi ?? 0) - (b.distanceMi ?? 0)
      return (a.date + a.start).localeCompare(b.date + String(b.start))
    })
    return list
  }, [open, q, dept, loc, sort])

  const potential = filtered.reduce((a, s) => a + shiftPay(s), 0)
  const isMatch = (s: Shift) => s.departmentId === me.departmentId || s.locationId === me.homeLocationId

  const claim = (s: Shift) => {
    pickUpShift(s.id)
    setClaimed((c) => new Set(c).add(s.id))
    setDetail(null)
  }

  return (
    <PageShell>
      <PageHeader
        title="Shift Marketplace"
        subtitle={<><CountUp value={filtered.length} /> open shifts · <CountUp value={potential} format={(n) => currency(n)} /> up for grabs</>}
        actions={
          <Segmented
            options={[
              { value: 'soon', label: 'Soonest' },
              { value: 'pay', label: 'Best pay' },
              { value: 'near', label: 'Nearest' },
            ]}
            value={sort}
            onChange={setSort}
            layoutId="mkt-sort"
          />
        }
      />

      <Card className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-secondary/60 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search position, store, or skill…"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Pill active={dept === 'all'} onClick={() => setDept('all')}>All teams</Pill>
          {DEPARTMENTS.filter((d) => d.key !== 'management').map((d) => (
            <Pill key={d.id} active={dept === d.key} onClick={() => setDept(d.key)}>
              <DeptDot dept={d.key} /> {d.name}
            </Pill>
          ))}
        </div>
        <select
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring"
        >
          <option value="all">All stores</option>
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="No open shifts match" description="Try clearing a filter or checking back soon — new shifts appear here instantly." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 60).map((s, i) => {
            const dep = departmentKey(s.departmentId)
            const done = claimed.has(s.id)
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4), type: 'spring', stiffness: 260, damping: 26 }}
              >
                <Tilt className="h-full" max={5}>
                <SpotlightCard className="card-base flex h-full flex-col overflow-hidden transition-shadow hover:shadow-elevated">
                  <div className={cn('h-1.5 w-full', `bg-dept-${dep}`)} />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-semibold leading-tight">{positionName(s.positionId)}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DeptDot dept={dep} /> {departmentName(s.departmentId)}
                        </p>
                      </div>
                      {isMatch(s) && (
                        <Badge tone="success" className="shrink-0">
                          <Sparkles className="h-3 w-3" /> Great match
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5 text-[13px]">
                      <Row icon={Clock}>{fullDate(s.date)}</Row>
                      <Row icon={Clock}>{minutesToLabel(s.start)} – {minutesToLabel(s.end)} · {shiftHours(s).toFixed(1)}h</Row>
                      <Row icon={MapPin}>{locationName(s.locationId)}</Row>
                      <Row icon={Navigation}>{s.distanceMi} mi away</Row>
                    </div>

                    {s.requiredSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {s.requiredSkills.map((k) => (
                          <span key={k} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{k}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold tabular">{currency(shiftPay(s))}</p>
                        <p className="text-[11px] text-muted-foreground">estimated pay</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {done ? (
                        <Button variant="success" className="flex-1" disabled>
                          <Check className="h-4 w-4" /> Requested
                        </Button>
                      ) : (
                        <Button className="flex-1" onClick={() => claim(s)}>Pick up shift</Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => setDetail(s)} aria-label="Details">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SpotlightCard>
                </Tilt>
              </motion.div>
            )
          })}
        </div>
      )}

      <DetailModal shift={detail} onClose={() => setDetail(null)} onClaim={claim} onAsk={() => { addToast({ title: 'Message sent to manager', kind: 'info' }); setDetail(null) }} claimed={detail ? claimed.has(detail.id) : false} />
    </PageShell>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60',
      )}
    >
      {children}
    </button>
  )
}

function Row({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-foreground/90">{children}</span>
    </p>
  )
}

function DetailModal({
  shift,
  onClose,
  onClaim,
  onAsk,
  claimed,
}: {
  shift: Shift | null
  onClose: () => void
  onClaim: (s: Shift) => void
  onAsk: () => void
  claimed: boolean
}) {
  if (!shift) return null
  return (
    <Modal open={!!shift} onClose={onClose} title={positionName(shift.positionId)} description={`${locationName(shift.locationId)} · ${fullDate(shift.date)}`}>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Pay" value={currency(shiftPay(shift))} />
          <Stat label="Length" value={`${shiftHours(shift).toFixed(1)}h`} />
          <Stat label="Distance" value={`${shift.distanceMi} mi`} />
        </div>
        <div className="rounded-xl bg-secondary/40 p-3 text-sm">
          <p className="font-medium">{minutesToLabel(shift.start)} – {minutesToLabel(shift.end)}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {locationName(shift.locationId)} · {locationShort(shift.locationId)}</p>
        </div>
        {shift.requiredSkills.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Required skills</p>
            <div className="flex flex-wrap gap-1.5">{shift.requiredSkills.map((k) => <Badge key={k} tone="primary">{k}</Badge>)}</div>
          </div>
        )}
        <div className="flex gap-2">
          {claimed ? (
            <Button variant="success" className="flex-1" disabled><Check className="h-4 w-4" /> Requested</Button>
          ) : (
            <Button className="flex-1" onClick={() => onClaim(shift)}>Pick up shift</Button>
          )}
          <Button variant="outline" onClick={onAsk}>Ask manager</Button>
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <p className="text-lg font-bold tabular">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
