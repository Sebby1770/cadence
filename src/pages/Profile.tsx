import { motion } from 'framer-motion'
import { Star, Flame, Clock, CalendarDays, History, Trophy, CalendarCheck2, Download, Award } from 'lucide-react'
import { badgeIcon } from '@/components/shared/badgeIcon'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { BADGES, EMPLOYEES } from '@/data/mock'
import {
  getEmployee,
  locationName,
  pastShifts,
  positionName,
  upcomingShifts,
  weeklyHours,
} from '@/data/selectors'
import { cn, formatHours } from '@/lib/utils'
import { weekDates } from '@/lib/dates'
import { buildIcs } from '@/lib/staffing'
import { Avatar, Badge, Button, Card, Ring } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

export default function Profile() {
  const now = useNow(60_000)
  const shifts = useStore((s) => s.shifts)
  const recognition = useStore((s) => s.recognition)
  const addToast = useStore((s) => s.addToast)
  const me = getEmployee(useStore((s) => s.currentUserId))!

  const wk = weeklyHours(shifts, me.id, weekDates(now))
  const upcoming = upcomingShifts(shifts, me.id, now, 20)
  const past = pastShifts(shifts, me.id, now)
  const received = recognition.filter((r) => r.toId === me.id)

  const leaderboard = [...EMPLOYEES].sort((a, b) => b.streak - a.streak).slice(0, 5)

  const exportIcs = () => {
    const ics = buildIcs(shifts, me, now)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cadence.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    addToast({ title: 'Exported cadence.ics', description: 'Your shifts are ready to import.', kind: 'info' })
  }

  return (
    <PageShell>
      <PageHeader title="Profile" subtitle="Your hours, achievements, and preferences." />

      {/* Banner */}
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-primary/40 via-purple-500/30 to-dept-floor/30 sm:h-32">
          <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
          <Avatar src={me.avatar} name={me.name} size="2xl" className="-mt-12 ring-4 ring-card" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">{me.name}</h2>
            <p className="text-sm text-muted-foreground">{positionName(me.positionId)} · {locationName(me.homeLocationId)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2.5 py-1 text-[13px] font-semibold text-amber-500"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {me.rating.toFixed(1)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-dept-kitchen/12 px-2.5 py-1 text-[13px] font-semibold text-dept-kitchen"><Flame className="h-3.5 w-3.5" /> {me.streak}-shift streak</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock} label="Hours this week" value={formatHours(wk, true)} />
        <StatCard icon={CalendarDays} label="Upcoming shifts" value={String(upcoming.length)} />
        <StatCard icon={History} label="Shifts worked" value={String(past.length + 84)} />
        <Card className="flex items-center gap-3 p-4">
          <Ring value={me.punctuality} size={52} stroke={6} label={`${me.punctuality}%`} tone="hsl(var(--success))" />
          <div><p className="text-sm font-semibold">Punctuality</p><p className="text-xs text-muted-foreground">on-time rate</p></div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Achievements */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 inline-flex items-center gap-2 text-[15px] font-semibold"><Trophy className="h-4 w-4 text-amber-500" /> Achievements</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BADGES.map((b, i) => {
              const earned = me.badges.includes(b.id)
              const Icon = badgeIcon(b.icon)
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn('flex flex-col items-center gap-2 rounded-2xl border p-4 text-center', earned ? 'border-border bg-card' : 'border-dashed border-border bg-secondary/30 opacity-55')}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={earned ? { background: `hsl(${b.color} / 0.14)`, color: `hsl(${b.color})` } : undefined}>
                    <Icon className={cn('h-5 w-5', !earned && 'text-muted-foreground')} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold leading-tight">{b.name}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{earned ? b.description : 'Locked'}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card className="p-5">
          <h3 className="mb-3 inline-flex items-center gap-2 text-[15px] font-semibold"><Flame className="h-4 w-4 text-dept-kitchen" /> Streak leaders</h3>
          <div className="space-y-2">
            {leaderboard.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3">
                <span className={cn('w-5 text-center text-sm font-bold tabular', i === 0 ? 'text-amber-500' : 'text-muted-foreground')}>{i + 1}</span>
                <Avatar src={e.avatar} name={e.name} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{e.name}{e.id === me.id && <span className="text-muted-foreground"> · you</span>}</p>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-dept-kitchen"><Flame className="h-3.5 w-3.5" /> {e.streak}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Skills & availability */}
        <Card className="p-5">
          <h3 className="mb-3 text-[15px] font-semibold">Skills</h3>
          <div className="flex flex-wrap gap-1.5">{me.skills.map((s) => <Badge key={s} tone="primary">{s}</Badge>)}</div>
          <h3 className="mb-3 mt-5 text-[15px] font-semibold">Certifications</h3>
          <div className="flex flex-wrap gap-1.5">{me.certifications.map((c) => <Badge key={c} tone="success">{c}</Badge>)}</div>
          <h3 className="mb-2 mt-5 text-[15px] font-semibold">Availability</h3>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Prefers <strong className="text-foreground">{formatHours(me.availability.preferred)}</strong>/wk</span>
            <span>Max <strong className="text-foreground">{me.availability.max}h</strong></span>
          </div>
        </Card>

        {/* Recognition */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 inline-flex items-center gap-2 text-[15px] font-semibold"><Award className="h-4 w-4 text-primary" /> Recognition received</h3>
          {received.length ? (
            <div className="space-y-3">
              {received.map((r) => {
                const from = getEmployee(r.fromId)
                return (
                  <div key={r.id} className="flex gap-3 rounded-xl bg-secondary/40 p-3">
                    {from && <Avatar src={from.avatar} name={from.name} size="sm" />}
                    <div className="flex-1">
                      <p className="text-[13px]">{r.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">— {from?.name} · ❤️ {r.reactions}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No shout-outs yet — keep being awesome.</p>
          )}
        </Card>
      </div>

      {/* Calendar integrations */}
      <Card className="p-5">
        <h3 className="mb-3 inline-flex items-center gap-2 text-[15px] font-semibold"><CalendarCheck2 className="h-4 w-4" /> Calendar sync</h3>
        <div className="flex flex-wrap gap-2">
          {['Google Calendar', 'Apple Calendar', 'Outlook'].map((c) => (
            <Button key={c} variant="outline" onClick={() => addToast({ title: `Connected to ${c}`, kind: 'success' })}>{c}</Button>
          ))}
          <Button variant="secondary" onClick={exportIcs}><Download className="h-4 w-4" /> Export .ics</Button>
        </div>
      </Card>
    </PageShell>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-2xl font-bold tabular">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}
