import { useMemo, useState } from 'react'
import { Plane, Save, X, Plus, Clock3, MapPin } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { LOCATIONS } from '@/data/mock'
import { getEmployee, locationShort } from '@/data/selectors'
import { cn, minutesToLabel, formatHours } from '@/lib/utils'
import { Button, Card, Ring } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_NAME: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' }
const MIN = 360
const MAX = 1440

type Windows = Record<number, [number, number] | null>

export default function Availability() {
  const me = getEmployee(useStore((s) => s.currentUserId))!
  const addToast = useStore((s) => s.addToast)

  const [windows, setWindows] = useState<Windows>(() => ({ ...me.availability.windows }))
  const [preferred, setPreferred] = useState(me.availability.preferred)
  const [minH, setMinH] = useState(me.availability.min)
  const [maxH, setMaxH] = useState(me.availability.max)
  const [prefLocs, setPrefLocs] = useState<string[]>(me.availability.preferredLocationIds)
  const [vacation, setVacation] = useState(me.availability.vacationMode)
  const [unavailable, setUnavailable] = useState<string[]>(me.availability.unavailableDates)
  const [newDate, setNewDate] = useState('')

  const weeklyHours = useMemo(
    () => Object.values(windows).reduce((acc, w) => acc + (w ? (w[1] - w[0]) / 60 : 0), 0),
    [windows],
  )

  const toggleDay = (d: number) =>
    setWindows((w) => ({ ...w, [d]: w[d] ? null : [540, 1020] }))
  const setStart = (d: number, v: number) =>
    setWindows((w) => ({ ...w, [d]: w[d] ? [Math.min(v, w[d]![1] - 60), w[d]![1]] : w[d] }))
  const setEnd = (d: number, v: number) =>
    setWindows((w) => ({ ...w, [d]: w[d] ? [w[d]![0], Math.max(v, w[d]![0] + 60)] : w[d] }))

  const toggleLoc = (id: string) =>
    setPrefLocs((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <PageShell>
      <PageHeader
        title="Availability"
        subtitle="Tell us when you can work — it repeats every week."
        actions={<Button onClick={() => addToast({ title: 'Availability saved', description: 'Your manager will see your updated preferences.', kind: 'success' })}><Save className="h-4 w-4" /> Save</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Vacation banner */}
          <Card className={cn('flex items-center gap-4 p-4', vacation && 'ring-2 ring-warning/40')}>
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', vacation ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-foreground')}>
              <Plane className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Vacation mode</p>
              <p className="text-sm text-muted-foreground">{vacation ? 'You won’t be scheduled or offered shifts.' : 'Turn on to pause all scheduling.'}</p>
            </div>
            <Toggle on={vacation} onClick={() => setVacation((v) => !v)} />
          </Card>

          {/* Weekly windows */}
          <Card className="p-5">
            <h3 className="mb-4 text-[15px] font-semibold">Weekly availability</h3>
            <div className="space-y-2.5">
              {DAY_ORDER.map((d) => {
                const w = windows[d]
                return (
                  <div key={d} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
                    <div className="flex w-32 items-center gap-2">
                      <Toggle on={!!w} onClick={() => toggleDay(d)} small />
                      <span className={cn('text-sm font-medium', !w && 'text-muted-foreground')}>{DAY_NAME[d]}</span>
                    </div>
                    {w ? (
                      <div className="flex flex-1 items-center gap-3">
                        <span className="w-16 text-right text-xs tabular text-muted-foreground">{minutesToLabel(w[0])}</span>
                        <div className="relative flex-1">
                          <div className="h-2 rounded-full bg-secondary" />
                          <div className="absolute top-0 h-2 rounded-full bg-primary/70" style={{ left: `${((w[0] - MIN) / (MAX - MIN)) * 100}%`, right: `${100 - ((w[1] - MIN) / (MAX - MIN)) * 100}%` }} />
                          <input type="range" min={MIN} max={MAX} step={30} value={w[0]} onChange={(e) => setStart(d, +e.target.value)} className="absolute inset-x-0 -top-1 h-4 w-full cursor-pointer appearance-none bg-transparent" />
                          <input type="range" min={MIN} max={MAX} step={30} value={w[1]} onChange={(e) => setEnd(d, +e.target.value)} className="absolute inset-x-0 -top-1 h-4 w-full cursor-pointer appearance-none bg-transparent" />
                        </div>
                        <span className="w-16 text-xs tabular text-muted-foreground">{minutesToLabel(w[1])}</span>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Unavailable dates */}
          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold">Specific dates off</h3>
            <div className="flex flex-wrap gap-2">
              {unavailable.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[13px] font-medium">
                  {new Date(`${d}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <button onClick={() => setUnavailable((u) => u.filter((x) => x !== d))} className="text-muted-foreground hover:text-danger"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm outline-none focus-ring" />
                <Button size="sm" variant="outline" disabled={!newDate} onClick={() => { if (newDate && !unavailable.includes(newDate)) setUnavailable((u) => [...u, newDate].sort()); setNewDate('') }}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="flex flex-col items-center gap-2 p-5 text-center">
            <Ring value={weeklyHours} max={maxH} size={96} stroke={8} label={formatHours(weeklyHours, true)} sublabel="available" />
            <p className="text-sm text-muted-foreground">{formatHours(weeklyHours)} of availability across the week</p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-[15px] font-semibold">Hours preferences</h3>
            <SliderRow icon={Clock3} label="Preferred / week" value={preferred} min={8} max={45} onChange={setPreferred} suffix="h" />
            <SliderRow icon={Clock3} label="Minimum" value={minH} min={0} max={30} onChange={setMinH} suffix="h" />
            <SliderRow icon={Clock3} label="Maximum" value={maxH} min={20} max={48} onChange={setMaxH} suffix="h" />
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 inline-flex items-center gap-1.5 text-[15px] font-semibold"><MapPin className="h-4 w-4" /> Preferred locations</h3>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggleLoc(l.id)}
                  className={cn('rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors', prefLocs.includes(l.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}
                >
                  {locationShort(l.id)}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

function Toggle({ on, onClick, small }: { on: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn('relative shrink-0 rounded-full transition-colors', small ? 'h-5 w-9' : 'h-6 w-11', on ? 'bg-primary' : 'bg-secondary')}
    >
      <span className={cn('absolute top-0.5 rounded-full bg-white shadow transition-all', small ? 'h-4 w-4' : 'h-5 w-5', on ? (small ? 'left-4' : 'left-5') : 'left-0.5')} />
    </button>
  )
}

function SliderRow({ icon: Icon, label, value, min, max, onChange, suffix }: { icon: typeof Clock3; label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
        <span className="text-sm font-bold tabular">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary" />
    </div>
  )
}
