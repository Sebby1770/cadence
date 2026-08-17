import type { Employee, Location, Shift } from '@/data/types'

/** Paid hours in a shift (net of unpaid break). Mirrors selectors.shiftHours. */
export function shiftHours(shift: Pick<Shift, 'start' | 'end' | 'breakMin'>): number {
  return (shift.end - shift.start - (shift.breakMin ?? 0)) / 60
}

/** Scheduled hours for one employee across the given ISO dates. */
export function weeklyHours(shifts: Shift[], employeeId: string, weekDates: string[]): number {
  return shifts
    .filter((s) => s.employeeId === employeeId && weekDates.includes(s.date))
    .reduce((acc, s) => acc + shiftHours(s), 0)
}

/**
 * True when two assigned shifts belong to the same person on the same date
 * and their time ranges overlap. End is exclusive, so adjacent shifts do not overlap.
 */
export function shiftsOverlap(a: Shift, b: Shift): boolean {
  if (!a.employeeId || !b.employeeId) return false
  if (a.employeeId !== b.employeeId) return false
  if (a.date !== b.date) return false
  if (a.id && b.id && a.id === b.id) return false
  return a.start < b.end && b.start < a.end
}

export interface DoubleBook {
  a: Shift
  b: Shift
  overlapMin: number
}

/** Overlapping assigned shift pairs. Each pair is reported once (stable id order). */
export function findDoubleBooks(shifts: Shift[]): DoubleBook[] {
  const byKey = new Map<string, Shift[]>()
  for (const s of shifts) {
    if (!s.employeeId) continue
    const key = `${s.employeeId}|${s.date}`
    const list = byKey.get(key)
    if (list) list.push(s)
    else byKey.set(key, [s])
  }

  const pairs: DoubleBook[] = []
  for (const list of byKey.values()) {
    if (list.length < 2) continue
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        if (!shiftsOverlap(a, b)) continue
        const left = a.id <= b.id ? a : b
        const right = a.id <= b.id ? b : a
        pairs.push({
          a: left,
          b: right,
          overlapMin: Math.min(a.end, b.end) - Math.max(a.start, b.start),
        })
      }
    }
  }
  return pairs
}

export interface OvertimeFlag {
  employee: Employee
  hours: number
  max: number
  overBy: number
}

/** Employees whose scheduled weekly hours exceed availability.max. */
export function overtimeFlags(shifts: Shift[], employees: Employee[], weekDates: string[]): OvertimeFlag[] {
  const flags: OvertimeFlag[] = []
  for (const employee of employees) {
    const hours = weeklyHours(shifts, employee.id, weekDates)
    const max = employee.availability.max
    if (hours > max) {
      flags.push({ employee, hours, max, overBy: hours - max })
    }
  }
  return flags.sort((a, b) => b.overBy - a.overBy)
}

export interface CoverageGap {
  location: Location
  date: string
  assigned: number
  target: number
  shortfall: number
}

/** Locations whose assigned headcount on `dateStr` is below headcountTarget. */
export function coverageGaps(shifts: Shift[], locations: Location[], dateStr: string): CoverageGap[] {
  const gaps: CoverageGap[] = []
  for (const location of locations) {
    const assigned = shifts.filter(
      (s) => s.date === dateStr && s.locationId === location.id && Boolean(s.employeeId),
    ).length
    const target = location.headcountTarget
    if (assigned < target) {
      gaps.push({
        location,
        date: dateStr,
        assigned,
        target,
        shortfall: target - assigned,
      })
    }
  }
  return gaps.sort((a, b) => b.shortfall - a.shortfall || a.assigned / a.target - b.assigned / b.target)
}

export interface HoursFairnessRow {
  employee: Employee
  hours: number
  delta: number
}

export interface HoursFairness {
  mean: number
  stdev: number
  count: number
  byEmployee: HoursFairnessRow[]
}

/**
 * Mean and population stdev of weekly hours among people with at least one
 * assigned shift in `weekDates`.
 */
export function hoursFairness(shifts: Shift[], employees: Employee[], weekDates: string[]): HoursFairness {
  const byEmployee: HoursFairnessRow[] = []
  for (const employee of employees) {
    const hours = weeklyHours(shifts, employee.id, weekDates)
    if (hours > 0) byEmployee.push({ employee, hours, delta: 0 })
  }

  const count = byEmployee.length
  if (count === 0) return { mean: 0, stdev: 0, count: 0, byEmployee }

  const mean = byEmployee.reduce((acc, row) => acc + row.hours, 0) / count
  for (const row of byEmployee) row.delta = row.hours - mean
  const variance = byEmployee.reduce((acc, row) => acc + row.delta * row.delta, 0) / count
  const stdev = Math.sqrt(variance)
  byEmployee.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return { mean, stdev, count, byEmployee }
}

const ICS_STATUSES: ReadonlySet<Shift['status']> = new Set(['published', 'confirmed'])

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local floating ICS timestamp from an ISO date plus minutes-since-midnight. */
function icsLocalFromMinutes(dateStr: string, minutes: number): string {
  const extraDays = Math.floor(minutes / 1440)
  const mins = minutes - extraDays * 1440
  const [y, mo, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, mo - 1, d + extraDays, Math.floor(mins / 60), mins % 60, 0, 0)
  return `${dt.getFullYear()}${pad2(dt.getMonth() + 1)}${pad2(dt.getDate())}T${pad2(dt.getHours())}${pad2(dt.getMinutes())}00`
}

function icsUtcStamp(now: Date): string {
  return (
    `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}` +
    `T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`
  )
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

function shiftEndMs(shift: Shift): number {
  const extraDays = Math.floor(shift.end / 1440)
  const mins = shift.end - extraDays * 1440
  const [y, mo, d] = shift.date.split('-').map(Number)
  return new Date(y, mo - 1, d + extraDays, Math.floor(mins / 60), mins % 60, 0, 0).getTime()
}

/**
 * VCALENDAR of the employee's upcoming published/confirmed shifts.
 * Lines are CRLF-terminated. DTSTART/DTEND are floating local times.
 */
export function buildIcs(shifts: Shift[], employee: Employee, now: Date): string {
  const upcoming = shifts
    .filter(
      (s) =>
        s.employeeId === employee.id &&
        ICS_STATUSES.has(s.status) &&
        shiftEndMs(s) >= now.getTime(),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)

  const stamp = icsUtcStamp(now)
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence//Staffing 1.2//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const shift of upcoming) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${shift.id}@cadence.work`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocalFromMinutes(shift.date, shift.start)}`,
      `DTEND:${icsLocalFromMinutes(shift.date, shift.end)}`,
      `SUMMARY:${escapeIcsText(employee.name)}`,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
