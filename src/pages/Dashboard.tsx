import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Store,
  Repeat2,
  Plane,
  CalendarDays,
  ArrowRight,
  Clock,
  TrendingUp,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Sparkles,
  Megaphone,
  ChevronRight,
  Flame,
  DollarSign,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { weekDates } from '@/lib/dates'
import { cn, currency, formatHours, minutesToLabel, relativeTime } from '@/lib/utils'
import {
  getEmployee,
  getLocation,
  locationName,
  nextShift,
  openShifts,
  positionName,
  shiftHours,
  shiftPay,
  shiftsOn,
  upcomingShifts,
  weeklyHours,
  workingNow,
} from '@/data/selectors'
import { iso } from '@/lib/dates'
import { Avatar, Button, Card, Progress, Ring } from '@/components/ui'
import { ShiftListItem } from '@/components/shared/ShiftBits'

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 }

function greeting(h: number) {
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const now = useNow(60_000)
  const navigate = useNavigate()
  const shifts = useStore((s) => s.shifts)
  const me = getEmployee(useStore((s) => s.currentUserId))!
  const announcements = useStore((s) => s.announcements)
  const pendingSwaps = useStore((s) => s.swaps.filter((x) => x.status === 'pending'))
  const pendingLeaves = useStore((s) => s.leaves.filter((l) => l.status === 'pending'))

  const week = useMemo(() => weekDates(now), [now])
  const myWeekHours = weeklyHours(shifts, me.id, week)
  const next = nextShift(shifts, me.id, now)
  const nextStart = next ? (() => { const d = new Date(`${next.date}T00:00`); d.setMinutes(next.start); return d })() : null
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nextInProgress = !!next && next.date === iso(now) && nowMin >= next.start && nowMin < next.end
  const upcoming = upcomingShifts(shifts, me.id, now, 4)
  const open = openShifts(shifts)
  const working = workingNow(shifts, now)
  const pendingCount = pendingSwaps.length + pendingLeaves.length

  const todayEarnings = upcoming
    .filter((s) => s.date === iso(now))
    .reduce((a, s) => a + shiftPay(s), 0)
  const weekEarnings = shifts
    .filter((s) => s.employeeId === me.id && week.includes(s.date))
    .reduce((a, s) => a + shiftPay(s), 0)

  const quickActions = [
    { label: 'Pick up shift', icon: Store, to: '/marketplace', tint: 'from-primary to-indigo-500' },
    { label: 'Offer shift', icon: Repeat2, to: '/swaps', tint: 'from-dept-bar to-fuchsia-500' },
    { label: 'Request leave', icon: Plane, to: '/leave', tint: 'from-dept-floor to-cyan-500' },
    { label: 'View roster', icon: CalendarDays, to: '/schedule', tint: 'from-dept-support to-emerald-500' },
  ]

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {greeting(now.getHours())}, <span className="text-gradient">{me.firstName}</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {next
                ? nextInProgress
                  ? `You’re on shift now — ${positionName(next.positionId)} at ${locationName(
                      next.locationId,
                    )} until ${minutesToLabel(next.end)}.`
                  : `Your next shift is ${relativeTime(nextStart!)} — ${positionName(
                      next.positionId,
                    )} at ${locationName(next.locationId)}.`
                : 'You have no upcoming shifts scheduled. Enjoy the break!'}
            </p>
            {me.streak > 4 && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-dept-kitchen/12 px-3 py-1 text-[13px] font-semibold text-dept-kitchen">
                <Flame className="h-4 w-4" /> {me.streak}-shift punctuality streak
              </div>
            )}
          </div>

          {/* Weather */}
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-background/50 p-4 backdrop-blur">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-soft">
              <Sun className="h-7 w-7" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular">72°</p>
              <p className="text-xs text-muted-foreground">Sunny · San Francisco</p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Wind className="h-3 w-3" /> 8mph</span>
                <span className="inline-flex items-center gap-1"><Droplets className="h-3 w-3" /> 41%</span>
                <span className="inline-flex items-center gap-1"><Cloud className="h-3 w-3" /> Clear</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.04 * i }}
            onClick={() => navigate(a.to)}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft', a.tint)}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold leading-tight">{a.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </motion.button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Next shift */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next shift</p>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          {next ? (
            <Link to="/schedule" className="mt-3 block">
              <p className="text-2xl font-bold tracking-tight">
                {new Date(`${next.date}T00:00`).toLocaleDateString('en-US', { weekday: 'short' })} ·{' '}
                {minutesToLabel(next.start)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {positionName(next.positionId)} · {locationName(next.locationId)}
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                {shiftHours(next).toFixed(1)}h shift <ChevronRight className="h-3 w-3" />
              </p>
            </Link>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nothing scheduled.</p>
          )}
        </Card>

        {/* Weekly hours */}
        <Card className="flex items-center gap-4 p-5">
          <Ring
            value={myWeekHours}
            max={me.availability.preferred}
            size={72}
            label={formatHours(myWeekHours, true)}
            sublabel={`/ ${me.availability.preferred}h`}
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">This week</p>
            <p className="mt-1 text-lg font-bold">{formatHours(myWeekHours)}</p>
            <p className="text-xs text-muted-foreground">
              {myWeekHours >= me.availability.preferred ? 'Target reached 🎯' : `${formatHours(me.availability.preferred - myWeekHours)} to goal`}
            </p>
          </div>
        </Card>

        {/* Available shifts */}
        <Link to="/marketplace">
          <Card hover className="h-full p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Open shifts</p>
              <Store className="h-4 w-4 text-dept-bar" />
            </div>
            <p className="mt-3 text-3xl font-bold tabular">{open.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">available to pick up nearby</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-dept-bar">
              Browse marketplace <ChevronRight className="h-3 w-3" />
            </p>
          </Card>
        </Link>

        {/* Estimated earnings */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Est. earnings</p>
            <DollarSign className="h-4 w-4 text-dept-support" />
          </div>
          <p className="mt-3 text-3xl font-bold tabular">{currency(weekEarnings)}</p>
          <p className="mt-1 text-sm text-muted-foreground">this week · {currency(todayEarnings)} today</p>
          <div className="mt-3">
            <Progress value={myWeekHours} max={me.availability.max} tone="success" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: upcoming + calendar strip */}
        <div className="space-y-6 lg:col-span-2">
          {/* Week strip */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">Your week</h3>
              <Link to="/schedule" className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                Full schedule <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {week.map((d) => {
                const mine = shiftsOn(shifts, d).filter((s) => s.employeeId === me.id)
                const date = new Date(`${d}T00:00`)
                const today = d === iso(now)
                return (
                  <button
                    key={d}
                    onClick={() => navigate('/schedule')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors',
                      today ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary/60',
                    )}
                  >
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={cn('text-lg font-bold tabular', today && 'text-primary')}>{date.getDate()}</span>
                    <span className="flex h-1.5 items-center gap-0.5">
                      {mine.slice(0, 3).map((s) => (
                        <span key={s.id} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ))}
                      {mine.length === 0 && <span className="h-1.5 w-1.5 rounded-full bg-border" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Upcoming shifts */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">Upcoming shifts</h3>
              <span className="text-xs text-muted-foreground">{upcoming.length} scheduled</span>
            </div>
            <div className="space-y-2.5">
              {upcoming.length ? (
                upcoming.map((s) => (
                  <ShiftListItem
                    key={s.id}
                    shift={s}
                    showPay
                    onClick={() => navigate('/schedule')}
                    right={
                      <span className="ml-2 rounded-lg bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {new Date(`${s.date}T00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                      </span>
                    }
                  />
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No upcoming shifts.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right: working now + pending + announcements */}
        <div className="space-y-6">
          {/* Team currently working */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">On shift now</h3>
              <Link to="/whos-working" className="text-xs font-medium text-primary">
                See all
              </Link>
            </div>
            {working.length ? (
              <div className="space-y-2.5">
                {working.slice(0, 5).map(({ shift, employee }) => (
                  <div key={shift.id} className="flex items-center gap-3">
                    <Avatar src={employee.avatar} name={employee.name} size="sm" status="working" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{employee.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {positionName(employee.positionId)} · until {minutesToLabel(shift.end)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No one is clocked in right now.</p>
            )}
          </Card>

          {/* Pending requests (manager) */}
          {pendingCount > 0 && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">Needs your attention</h3>
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-warning/15 px-1.5 text-xs font-bold text-warning">
                  {pendingCount}
                </span>
              </div>
              <div className="space-y-2">
                <Link to="/swaps" className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/60">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dept-bar/12 text-dept-bar">
                    <Repeat2 className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{pendingSwaps.length} swap requests</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link to="/leave" className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/60">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dept-floor/12 text-dept-floor">
                    <Plane className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{pendingLeaves.length} leave requests</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </Card>
          )}

          {/* Announcements */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">Announcements</h3>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => {
                const author = getEmployee(a.authorId)
                return (
                  <div key={a.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                    <div className="flex items-center gap-2">
                      {author && <Avatar src={author.avatar} name={author.name} size="xs" />}
                      <p className="text-xs text-muted-foreground">
                        {author?.firstName} · {relativeTime(a.createdAt)}
                      </p>
                      {a.pinned && (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-semibold leading-snug">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* AI nudge */}
          <Link to="/assistant">
            <Card hover className="overflow-hidden p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Ask Cadence AI</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    “Who can cover Friday night?” · “When am I working next?”
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Footer stat ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground"
      >
        <TrendingUp className="h-4 w-4 text-dept-support" />
        <span>
          <strong className="text-foreground">{working.length}</strong> on shift ·{' '}
          <strong className="text-foreground">{open.length}</strong> open shifts ·{' '}
          <strong className="text-foreground">{currency(weekEarnings)}</strong> projected this week
        </span>
      </motion.div>
    </div>
  )
}
