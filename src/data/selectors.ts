import { format } from 'date-fns'
import { EMPLOYEES, refDepartment, refEmployee, refLocation, refPosition } from './mock'
import type { Employee, Shift, WorkStatus } from './types'

export const getEmployee = (id: string | null | undefined) => refEmployee(id)
export const getPosition = (id: string) => refPosition(id)
export const getDepartment = (id: string) => refDepartment(id)
export const getLocation = (id: string) => refLocation(id)

export const positionName = (id: string) => refPosition(id)?.name ?? 'Team member'
export const locationName = (id: string) => refLocation(id)?.name ?? 'Unknown'
export const locationShort = (id: string) => refLocation(id)?.short ?? '—'
export const departmentName = (id: string) => refDepartment(id)?.name ?? 'Team'

export const departmentKey = (id: string) => refDepartment(id)?.key ?? 'floor'

/** Minutes of paid time in a shift (net of unpaid break). */
export function shiftDuration(shift: Shift) {
  return shift.end - shift.start - (shift.breakMin ?? 0)
}

export function shiftHours(shift: Shift) {
  return shiftDuration(shift) / 60
}

/** Estimated gross pay for a shift, at the position rate. */
export function shiftPay(shift: Shift) {
  const rate = refPosition(shift.positionId)?.rate ?? 18
  return shiftHours(shift) * rate
}

export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'night'

export function timeBlock(shift: Shift): TimeBlock {
  const h = Math.floor(shift.start / 60) % 24
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

export const isoOf = (d: Date) => format(d, 'yyyy-MM-dd')

export function shiftsOn(shifts: Shift[], dateStr: string) {
  return shifts.filter((s) => s.date === dateStr)
}

export function shiftsForEmployee(shifts: Shift[], employeeId: string) {
  return shifts
    .filter((s) => s.employeeId === employeeId)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + String(b.start)))
}

export function openShifts(shifts: Shift[]) {
  const today = isoOf(new Date())
  return shifts.filter((s) => s.status === 'open' && s.date >= today)
}

/** The employee's next upcoming shift relative to now. */
export function nextShift(shifts: Shift[], employeeId: string, now = new Date()) {
  const todayIso = isoOf(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return shiftsForEmployee(shifts, employeeId)
    .filter((s) => s.date > todayIso || (s.date === todayIso && s.end >= nowMin))
    .sort((a, b) => (a.date + String(a.start)).localeCompare(b.date + String(b.start)))[0]
}

export function upcomingShifts(shifts: Shift[], employeeId: string, now = new Date(), limit = 6) {
  const todayIso = isoOf(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return shiftsForEmployee(shifts, employeeId)
    .filter((s) => s.date > todayIso || (s.date === todayIso && s.end >= nowMin))
    .slice(0, limit)
}

export function pastShifts(shifts: Shift[], employeeId: string, now = new Date()) {
  const todayIso = isoOf(now)
  return shiftsForEmployee(shifts, employeeId).filter((s) => s.date < todayIso)
}

/** Sum of this-ISO-week scheduled hours for an employee. */
export function weeklyHours(shifts: Shift[], employeeId: string, weekDates: string[]) {
  return shifts
    .filter((s) => s.employeeId === employeeId && weekDates.includes(s.date))
    .reduce((acc, s) => acc + shiftHours(s), 0)
}

/** Live status derived from today's shifts and the current clock. */
export function liveStatus(shifts: Shift[], employee: Employee, now = new Date()): WorkStatus {
  const todayIso = isoOf(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const todays = shifts.filter((s) => s.employeeId === employee.id && s.date === todayIso)
  const active = todays.find((s) => nowMin >= s.start && nowMin < s.end)
  if (active) {
    // A short deterministic "break" window mid-shift for some folks.
    const mid = (active.start + active.end) / 2
    if (Math.abs(nowMin - mid) < 20 && employee.imgIndex % 4 === 0) return 'break'
    return 'working'
  }
  if (todays.some((s) => s.end <= nowMin)) return 'finished'
  if (todays.length) return 'scheduled'
  return 'off'
}

export function employeesWorkingOn(shifts: Shift[], dateStr: string) {
  const ids = new Set(shiftsOn(shifts, dateStr).map((s) => s.employeeId).filter(Boolean) as string[])
  return EMPLOYEES.filter((e) => ids.has(e.id))
}

export function workingNow(shifts: Shift[], now = new Date()) {
  const todayIso = isoOf(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const active = shifts.filter(
    (s) => s.date === todayIso && s.employeeId && nowMin >= s.start && nowMin < s.end,
  )
  return active
    .map((s) => ({ shift: s, employee: refEmployee(s.employeeId!) }))
    .filter((x): x is { shift: Shift; employee: Employee } => Boolean(x.employee))
}

/** Total labour cost for a set of shifts. */
export function laborCost(shifts: Shift[]) {
  return shifts.reduce((acc, s) => acc + shiftPay(s), 0)
}

/** Coverage ratio (0-1+) for a location on a date vs its headcount target. */
export function coverage(shifts: Shift[], locationId: string, dateStr: string) {
  const loc = refLocation(locationId)
  if (!loc) return 1
  const scheduled = shiftsOn(shifts, dateStr).filter(
    (s) => s.locationId === locationId && s.employeeId,
  ).length
  return scheduled / loc.headcountTarget
}
