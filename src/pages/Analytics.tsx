import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Clock, DollarSign, Store, Gauge, AlertTriangle, Copy, MapPin, Scale } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { DEPARTMENTS, EMPLOYEES, LOCATIONS } from '@/data/mock'
import {
  coverage,
  getEmployee,
  laborCost,
  shiftHours,
  shiftsOn,
} from '@/data/selectors'
import { currency, formatHours, minutesToLabel } from '@/lib/utils'
import { addDays, iso, shortDate, weekDates } from '@/lib/dates'
import {
  coverageGaps,
  findDoubleBooks,
  hoursFairness,
  overtimeFlags,
} from '@/lib/staffing'
import { Card, Segmented } from '@/components/ui'
import { CountUp } from '@/components/fx'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

const CHART = {
  primary: '#6366f1',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#94a3b8',
}
const GRID = 'rgba(120,120,140,0.15)'
const AXIS = { fontSize: 11, fill: 'currentColor', opacity: 0.55 }
const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
  boxShadow: '0 8px 30px -8px rgba(16,24,40,0.2)',
}

export default function Analytics() {
  const now = useNow(60_000)
  const shifts = useStore((s) => s.shifts)
  const leaves = useStore((s) => s.leaves)
  const [range, setRange] = useState<'this' | 'next'>('this')

  const week = useMemo(() => weekDates(range === 'this' ? now : addDays(now, 7)), [now, range])
  const today = iso(now)

  const weekShifts = shifts.filter((s) => s.employeeId && week.includes(s.date))
  const scheduledHours = weekShifts.reduce((a, s) => a + shiftHours(s), 0)
  const weekCost = laborCost(weekShifts)
  const openCount = shifts.filter((s) => s.status === 'open' && week.includes(s.date)).length
  const avgCoverage = LOCATIONS.reduce((a, l) => a + coverage(shifts, l.id, today), 0) / LOCATIONS.length

  // Overtime risk: employees over 38h in the week
  const perEmp = new Map<string, number>()
  weekShifts.forEach((s) => perEmp.set(s.employeeId!, (perEmp.get(s.employeeId!) ?? 0) + shiftHours(s)))
  const overtime = [...perEmp.values()].filter((h) => h > 38).length

  const hoursTrend = week.map((d) => ({
    day: new Date(`${d}T00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: Math.round(shiftsOn(shifts, d).filter((s) => s.employeeId).reduce((a, s) => a + shiftHours(s), 0)),
  }))

  const coverageByLoc = LOCATIONS.map((l) => ({ name: l.short, coverage: Math.round(coverage(shifts, l.id, today) * 100) }))

  const costByDept = DEPARTMENTS.filter((d) => d.key !== 'management').map((d) => ({
    name: d.name,
    cost: Math.round(laborCost(weekShifts.filter((s) => s.departmentId === d.id))),
  }))

  const filled = weekShifts.length
  const open = openCount
  const statusData = [
    { name: 'Filled', value: filled, color: CHART.emerald },
    { name: 'Open', value: open, color: CHART.amber },
  ]

  const peak = Array.from({ length: 9 }, (_, i) => {
    const hour = 6 + i * 2
    const count = shiftsOn(shifts, today).filter((s) => s.employeeId && s.start <= hour * 60 && s.end > hour * 60).length
    return { hour: `${hour}:00`, staff: count }
  })

  const leaveByType = ['annual', 'sick', 'personal', 'study', 'other'].map((t) => ({
    name: t[0].toUpperCase() + t.slice(1),
    days: leaves.filter((l) => l.type === t).reduce((a, l) => a + l.days, 0),
  }))

  const staffing = useMemo(() => {
    const weekShiftsAll = shifts.filter((s) => week.includes(s.date))
    const doubles = findDoubleBooks(weekShiftsAll).sort((a, b) => b.overlapMin - a.overlapMin)
    const ot = overtimeFlags(weekShiftsAll, EMPLOYEES, week)
    const gaps = week.flatMap((d) => coverageGaps(weekShiftsAll, LOCATIONS, d))
    gaps.sort((a, b) => b.shortfall - a.shortfall || a.assigned / a.target - b.assigned / b.target)
    const fairness = hoursFairness(weekShiftsAll, EMPLOYEES, week)
    const gapLocations = new Set(gaps.map((g) => g.location.id)).size
    return { doubles, ot, gaps, fairness, gapLocations }
  }, [shifts, week])

  return (
    <PageShell>
      <PageHeader
        title="Analytics"
        subtitle="Coverage, hours, and labour at a glance."
        actions={<Segmented options={[{ value: 'this', label: 'This week' }, { value: 'next', label: 'Next week' }]} value={range} onChange={setRange} layoutId="analytics-range" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={Clock} label="Scheduled hours" value={Math.round(scheduledHours)} format={(n) => `${Math.round(n)}h`} tint="text-primary" />
        <Kpi icon={DollarSign} label="Labour cost" value={weekCost} format={(n) => currency(n)} tint="text-dept-support" />
        <Kpi icon={Store} label="Open shifts" value={openCount} tint="text-dept-bar" />
        <Kpi icon={Gauge} label="Avg coverage" value={Math.round(avgCoverage * 100)} format={(n) => `${Math.round(n)}%`} tint="text-dept-floor" />
        <Kpi icon={AlertTriangle} label="Overtime risk" value={overtime} tint="text-warning" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Copy} label="Double-books" value={staffing.doubles.length} tint="text-danger" />
        <Kpi icon={AlertTriangle} label="Over weekly max" value={staffing.ot.length} tint="text-warning" />
        <Kpi icon={MapPin} label="Coverage-gap locations" value={staffing.gapLocations} tint="text-dept-floor" />
        <Kpi
          icon={Scale}
          label="Hours stdev"
          value={staffing.fairness.stdev}
          format={(n) => `${n.toFixed(1)}h`}
          tint="text-primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightTable
          title="Worst double-books"
          subtitle="Overlapping assigned pairs this week"
          empty="No overlapping assignments this week."
          rows={staffing.doubles.slice(0, 5).map((pair) => {
            const person = getEmployee(pair.a.employeeId)
            return {
              key: `${pair.a.id}-${pair.b.id}`,
              primary: person?.name ?? 'Teammate',
              secondary: `${shortDate(pair.a.date)} · ${minutesToLabel(pair.a.start)}–${minutesToLabel(pair.a.end)} / ${minutesToLabel(pair.b.start)}–${minutesToLabel(pair.b.end)}`,
              value: `${pair.overlapMin}m`,
            }
          })}
        />
        <InsightTable
          title="Worst overtime"
          subtitle="Furthest over availability.max"
          empty="Nobody is over their weekly max."
          rows={staffing.ot.slice(0, 5).map((row) => ({
            key: row.employee.id,
            primary: row.employee.name,
            secondary: `${formatHours(row.hours, true)} scheduled · max ${row.max}h`,
            value: `+${formatHours(row.overBy, true)}`,
          }))}
        />
        <InsightTable
          title="Worst coverage gaps"
          subtitle="Assigned headcount vs target"
          empty="Every location meets its target this week."
          rows={staffing.gaps.slice(0, 5).map((gap) => ({
            key: `${gap.location.id}-${gap.date}`,
            primary: gap.location.name,
            secondary: `${shortDate(gap.date)} · ${gap.assigned} assigned / ${gap.target} target`,
            value: `−${gap.shortfall}`,
          }))}
        />
        <InsightTable
          title="Hours furthest from mean"
          subtitle={`Mean ${formatHours(staffing.fairness.mean, true)} among ${staffing.fairness.count} working`}
          empty="Not enough scheduled hours to compare."
          rows={staffing.fairness.byEmployee.slice(0, 5).map((row) => ({
            key: row.employee.id,
            primary: row.employee.name,
            secondary: formatHours(row.hours, true),
            value: `${row.delta >= 0 ? '+' : '−'}${formatHours(Math.abs(row.delta), true)}`,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Hours scheduled" subtitle="Total staffed hours per day">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hoursTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="hrs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: GRID }} />
              <Area type="monotone" dataKey="hours" stroke={CHART.primary} strokeWidth={2.5} fill="url(#hrs)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Coverage by location" subtitle="Staffed vs target, today">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={coverageByLoc} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: GRID }} />
              <Bar dataKey="coverage" radius={[6, 6, 0, 0]}>
                {coverageByLoc.map((d, i) => (
                  <Cell key={i} fill={d.coverage < 75 ? CHART.rose : d.coverage < 100 ? CHART.amber : CHART.emerald} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Labour cost by department" subtitle="Projected for the week">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={costByDept} margin={{ top: 4, right: 12, bottom: 0, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={AXIS} axisLine={false} tickLine={false} width={72} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: GRID }} formatter={(v: number) => currency(v)} />
              <Bar dataKey="cost" radius={[0, 6, 6, 0]} fill={CHART.violet} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Shift fill rate" subtitle="Filled vs open this week">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={3} stroke="none">
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <Legend2 color={CHART.emerald} label="Filled" value={filled} />
              <Legend2 color={CHART.amber} label="Open" value={open} />
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-2xl font-bold tabular">{Math.round((filled / (filled + open || 1)) * 100)}%</p>
                <p className="text-xs text-muted-foreground">acceptance rate</p>
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Peak staffing" subtitle="Headcount by hour, today">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={peak} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="hour" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: GRID }} />
              <Bar dataKey="staff" radius={[6, 6, 0, 0]} fill={CHART.cyan} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leave requests" subtitle="Days requested by type">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={leaveByType} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: GRID }} />
              <Bar dataKey="days" radius={[6, 6, 0, 0]} fill={CHART.amber} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </PageShell>
  )
}

function Kpi({ icon: Icon, label, value, format, tint }: { icon: typeof Clock; label: string; value: number; format?: (n: number) => string; tint: string }) {
  return (
    <Card className="p-4">
      <Icon className={`h-4 w-4 ${tint}`} />
      <p className="mt-2 text-xl font-bold tabular"><CountUp value={value} format={format} /></p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="text-foreground">{children}</div>
    </Card>
  )
}

function Legend2({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold tabular">{value}</span>
    </div>
  )
}

function InsightTable({
  title,
  subtitle,
  empty,
  rows,
}: {
  title: string
  subtitle: string
  empty: string
  rows: { key: string; primary: string; secondary: string; value: string }[]
}) {
  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.primary}</p>
                <p className="truncate text-[11px] text-muted-foreground">{row.secondary}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
