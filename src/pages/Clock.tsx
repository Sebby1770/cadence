import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, Coffee, MapPin, QrCode, Camera, Check, Timer as TimerIcon } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { LOCATIONS } from '@/data/mock'
import { getEmployee, locationName } from '@/data/selectors'
import { cn, minutesToLabel } from '@/lib/utils'
import { Button, Card } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

const HISTORY = [
  { day: 'Yesterday', loc: 'Downtown Flagship', in: 360, out: 840, brk: 30, late: false },
  { day: 'Mon', loc: 'Downtown Flagship', in: 845, out: 1320, brk: 30, late: true },
  { day: 'Sun', loc: 'Marina Café', in: 540, out: 1020, brk: 30, late: false },
  { day: 'Sat', loc: 'Downtown Flagship', in: 360, out: 900, brk: 45, late: false },
  { day: 'Fri', loc: 'Uptown Store', in: 840, out: 1320, brk: 30, late: true },
  { day: 'Thu', loc: 'Downtown Flagship', in: 540, out: 1020, brk: 30, late: false },
]

export default function Clock() {
  const now = useNow(1000)
  const clock = useStore((s) => s.clock)
  const clockIn = useStore((s) => s.clockIn)
  const clockOut = useStore((s) => s.clockOut)
  const toggleBreak = useStore((s) => s.toggleBreak)
  const me = getEmployee(useStore((s) => s.currentUserId))!

  const [locId, setLocId] = useState(me.homeLocationId)
  const [verify, setVerify] = useState({ gps: true, qr: false, photo: false })

  const elapsed = clock.since ? now.getTime() - clock.since : 0
  const breakMs = clock.breakTotal + (clock.onBreak && clock.breakSince ? now.getTime() - clock.breakSince : 0)

  const weekTotal = useMemo(() => HISTORY.reduce((a, h) => a + (h.out - h.in - h.brk) / 60, 0), [])

  return (
    <PageShell>
      <PageHeader title="Time Clock" subtitle="Clock in, take breaks, and track your hours." />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main clock */}
        <Card className="relative overflow-hidden lg:col-span-2">
          <div className={cn('absolute inset-0 opacity-60 transition-colors', clock.clockedIn ? (clock.onBreak ? 'bg-warning/5' : 'bg-success/5') : '')} />
          <div className="relative flex flex-col items-center p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="mt-1 text-5xl font-bold tabular tracking-tight sm:text-6xl">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>

            {clock.clockedIn ? (
              <>
                <div className="mt-6 flex items-center gap-2 rounded-full bg-success/12 px-4 py-1.5 text-sm font-semibold text-success">
                  <span className="h-2 w-2 animate-pulse-ring rounded-full bg-success" /> On the clock at {clock.locationId ? locationName(clock.locationId) : ''}
                </div>
                <p className="mt-6 text-4xl font-bold tabular text-primary">{fmtDuration(elapsed)}</p>
                <p className="text-xs text-muted-foreground">elapsed{breakMs > 1000 ? ` · ${fmtDuration(breakMs)} on break` : ''}</p>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="lg" onClick={toggleBreak} className={cn(clock.onBreak && 'border-warning bg-warning/10 text-warning')}>
                    <Coffee className="h-4 w-4" /> {clock.onBreak ? 'End break' : 'Take a break'}
                  </Button>
                  <Button variant="danger" size="lg" onClick={clockOut}>
                    <Square className="h-4 w-4" /> Clock out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 w-full max-w-xs">
                  <label className="mb-1.5 block text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
                  <select value={locId} onChange={(e) => setLocId(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring">
                    {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <motion.div whileTap={{ scale: 0.96 }} className="mt-6">
                  <Button size="lg" className="h-14 px-10 text-base" onClick={() => clockIn(locId)}>
                    <Play className="h-5 w-5" /> Clock In
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </Card>

        {/* Verification + week total */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold">Verification</h3>
            <div className="space-y-2">
              <VerifyRow icon={MapPin} label="GPS location" on={verify.gps} onClick={() => setVerify((v) => ({ ...v, gps: !v.gps }))} />
              <VerifyRow icon={QrCode} label="QR check-in" on={verify.qr} onClick={() => setVerify((v) => ({ ...v, qr: !v.qr }))} />
              <VerifyRow icon={Camera} label="Photo verification" on={verify.photo} onClick={() => setVerify((v) => ({ ...v, photo: !v.photo }))} />
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary"><TimerIcon className="h-6 w-6" /></div>
            <div>
              <p className="text-2xl font-bold tabular">{weekTotal.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">logged this week</p>
            </div>
          </Card>
        </div>
      </div>

      {/* History */}
      <Card className="p-5">
        <h3 className="mb-3 text-[15px] font-semibold">Clock history</h3>
        <div className="space-y-1.5">
          {HISTORY.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              <span className="w-20 text-sm font-medium">{h.day}</span>
              <span className="text-xs text-muted-foreground">{h.loc}</span>
              <div className="ml-auto flex items-center gap-4 text-xs tabular">
                <span className="text-muted-foreground">In <span className="font-semibold text-foreground">{minutesToLabel(h.in)}</span></span>
                <span className="text-muted-foreground">Out <span className="font-semibold text-foreground">{minutesToLabel(h.out)}</span></span>
                <span className="text-muted-foreground">Break {h.brk}m</span>
                <span className="font-semibold">{((h.out - h.in - h.brk) / 60).toFixed(1)}h</span>
                {h.late && <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">Late</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  )
}

function VerifyRow({ icon: Icon, label, on, onClick }: { icon: typeof MapPin; label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-border p-2.5 text-left transition-colors hover:bg-secondary/50">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', on ? 'bg-success/12 text-success' : 'bg-secondary text-muted-foreground')}><Icon className="h-4 w-4" /></span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {on ? <Check className="h-4 w-4 text-success" /> : <span className="h-4 w-4 rounded-full border border-border" />}
    </button>
  )
}
