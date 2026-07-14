import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Send, Copy, Filter, MapPin, Clock, Users, Wand2, Rows3 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { DEPARTMENTS, LOCATIONS } from '@/data/mock'
import type { DeptKey, Shift } from '@/data/types'
import {
  departmentKey,
  getEmployee,
  locationName,
  positionName,
  shiftHours,
  shiftPay,
  shiftsOn,
} from '@/data/selectors'
import { cn, currency, minutesToLabel } from '@/lib/utils'
import { addDays, iso, weekDates, weekRangeLabel, monthLabel, startOfWeek } from '@/lib/dates'
import { Avatar, Badge, Button, Card, DeptDot, Modal, Segmented } from '@/components/ui'
import { ShiftChip } from '@/components/shared/ShiftBits'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

type View = 'day' | 'week' | 'month'

export default function Schedule() {
  const now = useNow(60_000)
  const navigate = useNavigate()
  const shifts = useStore((s) => s.shifts)
  const role = useStore((s) => s.role)
  const currentUserId = useStore((s) => s.currentUserId)
  const pickUpShift = useStore((s) => s.pickUpShift)
  const moveShift = useStore((s) => s.moveShift)
  const publishRoster = useStore((s) => s.publishRoster)
  const addToast = useStore((s) => s.addToast)

  const isManager = role === 'manager' || role === 'admin'
  const [view, setView] = useState<View>('week')
  const [cursor, setCursor] = useState(() => new Date())
  const [dept, setDept] = useState<'all' | DeptKey>('all')
  const [loc, setLoc] = useState<'all' | string>('all')
  const [myOnly, setMyOnly] = useState(false)
  const [dense, setDense] = useState(false)
  const [builder, setBuilder] = useState(false)
  const [selected, setSelected] = useState<Shift | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const match = useMemo(
    () => (s: Shift) =>
      (dept === 'all' || departmentKey(s.departmentId) === dept) &&
      (loc === 'all' || s.locationId === loc) &&
      (!myOnly || s.employeeId === currentUserId),
    [dept, loc, myOnly, currentUserId],
  )

  const step = (dir: number) =>
    setCursor((c) => addDays(c, dir * (view === 'month' ? 30 : view === 'week' ? 7 : 1)))

  const rangeLabel =
    view === 'month'
      ? monthLabel(cursor)
      : view === 'week'
        ? weekRangeLabel(cursor)
        : cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const week = weekDates(cursor)
  const activeShift = activeId ? shifts.find((s) => s.id === activeId) ?? null : null

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const overId = e.over?.id
    if (typeof overId === 'string' && overId.startsWith('day-')) {
      moveShift(String(e.active.id), overId.slice(4))
    }
  }

  const weekGrid = <WeekGrid week={week} now={now} shifts={shifts} match={match} onSelect={setSelected} builder={builder} dense={dense} />

  return (
    <PageShell>
      <PageHeader
        title="Schedule"
        subtitle={rangeLabel}
        actions={
          <>
            <div className="flex items-center rounded-xl border border-border bg-card">
              <button onClick={() => step(-1)} className="flex h-9 w-9 items-center justify-center rounded-l-xl text-muted-foreground hover:bg-secondary">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCursor(new Date())} className="h-9 border-x border-border px-3 text-[13px] font-medium hover:bg-secondary">
                Today
              </button>
              <button onClick={() => step(1)} className="flex h-9 w-9 items-center justify-center rounded-r-xl text-muted-foreground hover:bg-secondary">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Segmented
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
              ]}
              value={view}
              onChange={setView}
              layoutId="schedule-view"
            />
            {isManager && (
              <>
                {view === 'week' && (
                  <Button
                    variant={builder ? 'primary' : 'outline'}
                    size="md"
                    onClick={() => setBuilder((b) => !b)}
                  >
                    <Wand2 className="h-4 w-4" /> Builder
                  </Button>
                )}
                <Button variant="outline" size="md" onClick={() => addToast({ title: 'Last week copied', description: 'Draft shifts created for this week.', kind: 'success' })}>
                  <Copy className="h-4 w-4" /> Copy last week
                </Button>
                <Button size="md" onClick={publishRoster}>
                  <Send className="h-4 w-4" /> Publish
                </Button>
              </>
            )}
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </span>
        <FilterPills
          value={dept}
          onChange={(v) => setDept(v as 'all' | DeptKey)}
          options={[{ value: 'all', label: 'All teams' }, ...DEPARTMENTS.map((d) => ({ value: d.key, label: d.name }))]}
        />
        <span className="hidden h-5 w-px bg-border sm:block" />
        <FilterPills
          value={loc}
          onChange={setLoc}
          options={[{ value: 'all', label: 'All stores' }, ...LOCATIONS.map((l) => ({ value: l.id, label: l.short }))]}
        />
        <button
          onClick={() => setMyOnly((v) => !v)}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
            myOnly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="h-3.5 w-3.5" /> My shifts
        </button>
        {view === 'week' && (
          <button
            onClick={() => setDense((v) => !v)}
            title={dense ? 'Comfortable rows' : 'Compact rows'}
            aria-pressed={dense}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
              dense ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            <Rows3 className="h-3.5 w-3.5" /> Compact
          </button>
        )}
      </Card>

      {builder && view === 'week' && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-3.5 py-2.5 text-[13px] text-primary">
          <Wand2 className="h-4 w-4 shrink-0" />
          <span><strong>Builder mode</strong> — drag any shift between days to reschedule it. Changes save as a draft; publish when you’re done.</span>
        </div>
      )}

      {view === 'week' &&
        (builder ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
            {weekGrid}
            <DragOverlay dropAnimation={null}>
              {activeShift ? <div className="w-40 rotate-2 opacity-95"><ShiftChip shift={activeShift} /></div> : null}
            </DragOverlay>
          </DndContext>
        ) : (
          weekGrid
        ))}
      {view === 'day' && <DayView date={iso(cursor)} shifts={shifts} match={match} onSelect={setSelected} />}
      {view === 'month' && <MonthGrid cursor={cursor} now={now} shifts={shifts} match={match} onSelect={setSelected} />}

      <ShiftModal
        shift={selected}
        onClose={() => setSelected(null)}
        currentUserId={currentUserId}
        onPickUp={(id) => {
          pickUpShift(id)
          setSelected(null)
        }}
        onSwap={() => {
          setSelected(null)
          navigate('/swaps')
        }}
      />
    </PageShell>
  )
}

function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
            value === o.value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function DraggableShift({ shift, onSelect, dense }: { shift: Shift; onSelect: () => void; dense?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: shift.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn('touch-none', isDragging && 'opacity-40')}>
      <ShiftChip shift={shift} onClick={onSelect} compact={dense} />
    </div>
  )
}

function DroppableDay({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}` })
  return (
    <div ref={setNodeRef} className={cn('min-h-[120px] space-y-1.5 rounded-xl p-1 transition-colors', isOver && 'bg-primary/10 ring-2 ring-primary/40')}>
      {children}
    </div>
  )
}

function WeekGrid({
  week,
  now,
  shifts,
  match,
  onSelect,
  builder,
  dense,
}: {
  week: string[]
  now: Date
  shifts: Shift[]
  match: (s: Shift) => boolean
  onSelect: (s: Shift) => void
  builder?: boolean
  dense?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {week.map((d) => {
        const date = new Date(`${d}T00:00`)
        const today = d === iso(now)
        const day = shiftsOn(shifts, d).filter(match).sort((a, b) => a.start - b.start)
        const chips = day.length ? (
          day.map((s) =>
            builder ? (
              <DraggableShift key={s.id} shift={s} onSelect={() => onSelect(s)} dense={dense} />
            ) : (
              <ShiftChip key={s.id} shift={s} onClick={() => onSelect(s)} compact={dense} />
            ),
          )
        ) : (
          <p className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">No shifts</p>
        )
        return (
          <div key={d} className={builder ? '' : dense ? 'min-h-[120px]' : 'min-h-[160px]'}>
            <div className={cn('mb-2 flex items-center justify-between rounded-lg px-2 py-1.5', today && 'bg-primary/10')}>
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold tabular', today && 'bg-primary text-primary-foreground')}>
                {date.getDate()}
              </span>
            </div>
            {builder ? (
              <DroppableDay dateStr={d}>{chips}</DroppableDay>
            ) : (
              <div className={dense ? 'space-y-1' : 'space-y-1.5'}>{chips}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DayView({
  date,
  shifts,
  match,
  onSelect,
}: {
  date: string
  shifts: Shift[]
  match: (s: Shift) => boolean
  onSelect: (s: Shift) => void
}) {
  const day = shiftsOn(shifts, date).filter(match)
  const byLoc = LOCATIONS.map((l) => ({ loc: l, list: day.filter((s) => s.locationId === l.id).sort((a, b) => a.start - b.start) })).filter((x) => x.list.length)
  if (!byLoc.length) return <Card className="p-10 text-center text-sm text-muted-foreground">No shifts scheduled for this day.</Card>
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {byLoc.map(({ loc, list }) => (
        <Card key={loc.id} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-[15px] font-semibold">{loc.name}</h3>
            <Badge tone="neutral" className="ml-auto">{list.length} shifts</Badge>
          </div>
          <div className="space-y-2">
            {list.map((s) => {
              const emp = getEmployee(s.employeeId)
              const dept = departmentKey(s.departmentId)
              return (
                <button key={s.id} onClick={() => onSelect(s)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary/50">
                  <div className={cn('h-9 w-1.5 rounded-full', `bg-dept-${dept}`)} />
                  {emp ? <Avatar src={emp.avatar} name={emp.name} size="sm" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary"><Clock className="h-4 w-4" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{emp?.name ?? 'Open shift'}</p>
                    <p className="text-xs text-muted-foreground">{positionName(s.positionId)} · {minutesToLabel(s.start)}–{minutesToLabel(s.end)}</p>
                  </div>
                  <span className="text-sm font-bold tabular">{currency(shiftPay(s))}</span>
                </button>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}

function MonthGrid({
  cursor,
  now,
  shifts,
  match,
  onSelect,
}: {
  cursor: Date
  now: Date
  shifts: Shift[]
  match: (s: Shift) => boolean
  onSelect: (s: Shift) => void
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfWeek(first, { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => iso(addDays(gridStart, i)))
  return (
    <Card className="overflow-hidden p-2 sm:p-3">
      <div className="grid grid-cols-7">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const date = new Date(`${d}T00:00`)
          const inMonth = date.getMonth() === cursor.getMonth()
          const today = d === iso(now)
          const day = shiftsOn(shifts, d).filter(match).sort((a, b) => a.start - b.start)
          return (
            <div key={d} className={cn('min-h-[92px] rounded-lg border border-transparent p-1.5', inMonth ? 'bg-secondary/30' : 'opacity-40', today && 'border-primary')}>
              <div className="mb-1 flex justify-end">
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold tabular', today && 'bg-primary text-primary-foreground')}>{date.getDate()}</span>
              </div>
              <div className="space-y-0.5">
                {day.slice(0, 2).map((s) => <ShiftChip key={s.id} shift={s} compact onClick={() => onSelect(s)} />)}
                {day.length > 2 && <p className="px-1 text-[10px] font-medium text-muted-foreground">+{day.length - 2} more</p>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ShiftModal({
  shift,
  onClose,
  currentUserId,
  onPickUp,
  onSwap,
}: {
  shift: Shift | null
  onClose: () => void
  currentUserId: string
  onPickUp: (id: string) => void
  onSwap: () => void
}) {
  if (!shift) return null
  const emp = getEmployee(shift.employeeId)
  const dept = departmentKey(shift.departmentId)
  const open = shift.status === 'open'
  const mine = shift.employeeId === currentUserId
  return (
    <Modal open={!!shift} onClose={onClose} title={positionName(shift.positionId)} description={new Date(`${shift.date}T00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
          {emp ? <Avatar src={emp.avatar} name={emp.name} size="lg" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary"><Clock className="h-5 w-5" /></div>}
          <div>
            <p className="font-semibold">{emp?.name ?? 'Open shift — unassigned'}</p>
            <p className="text-sm text-muted-foreground">{emp ? positionName(emp.positionId) : 'Available to pick up'}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold tabular">{currency(shiftPay(shift))}</p>
            <p className="text-[11px] text-muted-foreground">est. pay</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Time" value={`${minutesToLabel(shift.start)} – ${minutesToLabel(shift.end)}`} />
          <Detail label="Length" value={`${shiftHours(shift).toFixed(1)} hours`} />
          <Detail label="Location" value={locationName(shift.locationId)} />
          <Detail label="Team" value={<span className="inline-flex items-center gap-1.5"><DeptDot dept={dept} /> {positionName(shift.positionId)}</span>} />
        </div>
        {shift.requiredSkills.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {shift.requiredSkills.map((s) => <Badge key={s} tone="primary">{s}</Badge>)}
            </div>
          </div>
        )}
        {shift.note && <p className="rounded-lg bg-warning/10 p-2.5 text-[13px] text-warning">📌 {shift.note}</p>}
        <div className="flex gap-2 pt-1">
          {open && <Button className="flex-1" onClick={() => onPickUp(shift.id)}>Pick up shift</Button>}
          {mine && <Button variant="outline" className="flex-1" onClick={onSwap}>Offer / Swap</Button>}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}
