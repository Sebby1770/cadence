import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Users, Store, Clock, DollarSign, TrendingUp } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { EMPLOYEES, LOCATIONS } from '@/data/mock'
import type { Location, Shift } from '@/data/types'
import { coverage, laborCost, positionName, shiftsOn } from '@/data/selectors'
import { cn, currency, seededRandom } from '@/lib/utils'
import { iso } from '@/lib/dates'
import { Avatar, Badge, Card, Progress } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

function coverTone(c: number): 'danger' | 'warning' | 'success' | 'primary' {
  if (c < 0.6) return 'danger'
  if (c < 0.85) return 'warning'
  if (c <= 1.2) return 'success'
  return 'primary'
}
function coverColor(c: number) {
  return c < 0.6 ? '356 72% 56%' : c < 0.85 ? '38 92% 50%' : c <= 1.2 ? '152 62% 42%' : '245 68% 60%'
}

export default function Locations() {
  const now = useNow(60_000)
  const shifts = useStore((s) => s.shifts)
  const [params, setParams] = useSearchParams()
  const [sel, setSel] = useState<Location>(LOCATIONS[0])
  const today = iso(now)

  useEffect(() => {
    const id = params.get('focus')
    const l = LOCATIONS.find((x) => x.id === id)
    if (l) setSel(l)
  }, [params])

  const cov = (l: Location) => coverage(shifts, l.id, today)

  return (
    <PageShell>
      <PageHeader title="Locations" subtitle="Live staffing across every store." />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Map */}
        <Card className="relative overflow-hidden lg:col-span-3">
          <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-secondary/40 to-secondary/10">
            <MapArt />
            {LOCATIONS.map((l, i) => {
              const c = cov(l)
              const active = l.id === sel.id
              return (
                <motion.button
                  key={l.id}
                  initial={{ scale: 0, y: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300, damping: 18 }}
                  onClick={() => { setSel(l); if (params.get('focus')) setParams({}) }}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{ left: `${l.map.x}%`, top: `${l.map.y}%` }}
                >
                  <span className="relative flex flex-col items-center">
                    <span
                      className={cn('flex items-center justify-center rounded-full text-white shadow-elevated transition-all', active ? 'h-9 w-9' : 'h-7 w-7')}
                      style={{ background: `hsl(${coverColor(c)})` }}
                    >
                      <MapPin className={cn(active ? 'h-5 w-5' : 'h-4 w-4')} fill="currentColor" />
                    </span>
                    {active && (
                      <span className="mt-1 whitespace-nowrap rounded-md bg-card px-2 py-0.5 text-[11px] font-semibold shadow-soft">{l.short}</span>
                    )}
                    <span className="absolute top-0 h-7 w-7 animate-ping rounded-full opacity-30" style={{ background: `hsl(${coverColor(c)})` }} />
                  </span>
                </motion.button>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border p-3 text-xs">
            <span className="font-semibold text-muted-foreground">Staffing heatmap</span>
            <Legend color="356 72% 56%" label="Understaffed" />
            <Legend color="38 92% 50%" label="Tight" />
            <Legend color="152 62% 42%" label="Balanced" />
            <Legend color="245 68% 60%" label="Over" />
          </div>
        </Card>

        {/* Detail */}
        <div className="space-y-4 lg:col-span-2">
          <LocationDetail loc={sel} shifts={shifts} today={today} />
        </div>
      </div>

      {/* All locations list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOCATIONS.map((l) => {
          const c = cov(l)
          return (
            <button key={l.id} onClick={() => setSel(l)} className="text-left">
              <Card hover className={cn('p-4', l.id === sel.id && 'ring-2 ring-primary')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${coverColor(c)})` }} />
                    <p className="font-semibold">{l.name}</p>
                  </div>
                  <Badge tone={coverTone(c)}>{Math.round(c * 100)}%</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{l.region} · target {l.headcountTarget}</p>
                <Progress className="mt-3" value={Math.min(c, 1.4)} max={1.4} tone={coverTone(c)} />
              </Card>
            </button>
          )
        })}
      </div>
    </PageShell>
  )
}

function LocationDetail({ loc, shifts, today }: { loc: Location; shifts: Shift[]; today: string }) {
  const dayShifts = shiftsOn(shifts, today).filter((s) => s.locationId === loc.id)
  const staffed = dayShifts.filter((s) => s.employeeId)
  const open = dayShifts.filter((s) => s.status === 'open')
  const managers = EMPLOYEES.filter((e) => e.role !== 'employee' && e.homeLocationId === loc.id)
  const cost = laborCost(staffed)
  const c = coverage(shifts, loc.id, today)

  const hours = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const hour = 8 + i * 2
      const active = dayShifts.filter((s) => s.employeeId && s.start <= hour * 60 && s.end > hour * 60).length
      return { hour, active, busy: seededRandom(`${loc.id}-${hour}`) }
    })
  }, [dayShifts, loc.id])
  const maxActive = Math.max(1, ...hours.map((h) => h.active))

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{loc.name}</h3>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {loc.address}</p>
        </div>
        <Badge tone={coverTone(c)}>{Math.round(c * 100)}% staffed</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat icon={Users} label="On shift" value={String(staffed.length)} />
        <MiniStat icon={Store} label="Open" value={String(open.length)} />
        <MiniStat icon={DollarSign} label="Labour" value={currency(cost)} />
      </div>

      <div className="mt-4">
        <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Busy periods</p>
        <div className="flex items-end gap-1.5">
          {hours.map((h) => (
            <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end">
                <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(h.active / maxActive) * 100}%`, minHeight: 3 }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {managers.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Managers on site</p>
          <div className="space-y-1.5">
            {managers.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <Avatar src={m.avatar} name={m.name} size="sm" status="working" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{positionName(m.positionId)}</p>
                </div>
                <Clock className="ml-auto h-3.5 w-3.5 text-success" />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-base font-bold tabular">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${color})` }} /> {label}
    </span>
  )
}

function MapArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#grid)" />
      {/* river / bay */}
      <path d="M-10 210 C 80 180, 140 260, 240 230 S 420 200, 420 240 L 420 320 L -10 320 Z" fill="hsl(var(--dept-floor) / 0.12)" />
      {/* park */}
      <ellipse cx="120" cy="90" rx="46" ry="30" fill="hsl(var(--dept-support) / 0.14)" />
      {/* roads */}
      <path d="M0 150 H400 M200 0 V300 M60 0 L120 300 M340 0 L280 300" stroke="hsl(var(--border))" strokeWidth="1.4" opacity="0.7" fill="none" />
    </svg>
  )
}
