import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Sunrise, Sun, Sunset, Moon, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { DEPARTMENTS, LOCATIONS } from '@/data/mock'
import type { Employee, Shift } from '@/data/types'
import {
  departmentKey,
  departmentName,
  getEmployee,
  liveStatus,
  locationShort,
  positionName,
  shiftsOn,
  timeBlock,
  type TimeBlock,
} from '@/data/selectors'
import { cn, minutesToLabel } from '@/lib/utils'
import { addDays, iso, fullDate } from '@/lib/dates'
import { Avatar, Card, DeptDot, StatusPill } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

const BLOCKS: { key: TimeBlock; label: string; icon: typeof Sun; tint: string }[] = [
  { key: 'morning', label: 'Morning', icon: Sunrise, tint: 'text-amber-500' },
  { key: 'afternoon', label: 'Afternoon', icon: Sun, tint: 'text-orange-500' },
  { key: 'evening', label: 'Evening', icon: Sunset, tint: 'text-rose-500' },
  { key: 'night', label: 'Night', icon: Moon, tint: 'text-indigo-400' },
]

export default function WhosWorking() {
  const now = useNow(60_000)
  const shifts = useStore((s) => s.shifts)
  const [cursor, setCursor] = useState(() => new Date())
  const [loc, setLoc] = useState<'all' | string>('all')
  const [q, setQ] = useState('')

  const date = iso(cursor)

  const staffed = useMemo(
    () =>
      shiftsOn(shifts, date)
        .filter((s) => s.employeeId && (loc === 'all' || s.locationId === loc))
        .map((s) => ({ shift: s, emp: getEmployee(s.employeeId)! }))
        .filter((x) => x.emp && x.emp.name.toLowerCase().includes(q.trim().toLowerCase())),
    [shifts, date, loc, q],
  )

  const buckets = BLOCKS.map((b) => ({
    ...b,
    items: staffed.filter((x) => timeBlock(x.shift) === b.key).sort((a, b2) => a.shift.start - b2.shift.start),
  }))

  const deptCounts = DEPARTMENTS.map((d) => ({
    d,
    count: staffed.filter((x) => x.emp.departmentId === d.id).length,
  })).filter((x) => x.count)

  return (
    <PageShell>
      <PageHeader
        title="Who's Working"
        subtitle={fullDate(date)}
        actions={
          <div className="flex items-center rounded-xl border border-border bg-card">
            <button onClick={() => setCursor((c) => addDays(c, -1))} className="flex h-9 w-9 items-center justify-center rounded-l-xl text-muted-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setCursor(new Date())} className="h-9 border-x border-border px-3 text-[13px] font-medium hover:bg-secondary">Today</button>
            <button onClick={() => setCursor((c) => addDays(c, 1))} className="flex h-9 w-9 items-center justify-center rounded-r-xl text-muted-foreground hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
          </div>
        }
      />

      {/* Summary strip */}
      <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-bold tabular leading-none">{staffed.length}</p>
            <p className="text-xs text-muted-foreground">on shift {date === iso(now) ? 'today' : 'this day'}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {deptCounts.map(({ d, count }) => (
            <div key={d.id} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[13px]">
              <DeptDot dept={d.key} /> <span className="font-medium">{d.name}</span>
              <span className="tabular text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-44 items-center gap-2 rounded-xl bg-secondary/60 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff…" className="h-full flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={loc} onChange={(e) => setLoc(e.target.value)} className="h-9 rounded-xl border border-border bg-card px-2 text-sm outline-none focus-ring">
            <option value="all">All stores</option>
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.short}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.key} className="flex flex-col">
            <div className="mb-2 flex items-center gap-2 px-1">
              <b.icon className={cn('h-4 w-4', b.tint)} />
              <h3 className="text-sm font-semibold">{b.label}</h3>
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-secondary px-1.5 text-[11px] font-semibold text-muted-foreground">{b.items.length}</span>
            </div>
            <div className="flex-1 space-y-2 rounded-2xl bg-secondary/30 p-2">
              {b.items.length ? (
                b.items.map((x, i) => <StaffCard key={x.shift.id} emp={x.emp} shift={x.shift} now={now} shifts={shifts} index={i} />)
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">No one scheduled</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function StaffCard({ emp, shift, now, shifts, index }: { emp: Employee; shift: Shift; now: Date; shifts: Shift[]; index: number }) {
  const status = liveStatus(shifts, emp, now)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="rounded-xl border border-border bg-card p-3 shadow-soft"
    >
      <div className="flex items-center gap-2.5">
        <Avatar src={emp.avatar} name={emp.name} size="md" status={status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{emp.name}</p>
          <p className="truncate text-xs text-muted-foreground">{positionName(emp.positionId)}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <DeptDot dept={departmentKey(emp.departmentId)} /> {departmentName(emp.departmentId)}
        </span>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{locationShort(shift.locationId)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-[11px] tabular text-muted-foreground">{minutesToLabel(shift.start)}–{minutesToLabel(shift.end)}</span>
        <StatusPill status={status} />
      </div>
    </motion.div>
  )
}
