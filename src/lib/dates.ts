import { addDays, format, isSameDay, isToday, startOfWeek, parseISO } from 'date-fns'

export const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/** The 7 ISO date strings for the ISO week (Mon-first) containing `ref`. */
export function weekDates(ref: Date, weekStartsOn: 0 | 1 = 1): string[] {
  const start = startOfWeek(ref, { weekStartsOn })
  return Array.from({ length: 7 }, (_, i) => iso(addDays(start, i)))
}

export function weekRangeLabel(ref: Date, weekStartsOn: 0 | 1 = 1) {
  const start = startOfWeek(ref, { weekStartsOn })
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  return sameMonth
    ? `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
}

export const dayLabel = (dateStr: string) => format(parseISO(dateStr), 'EEE')
export const dayNum = (dateStr: string) => format(parseISO(dateStr), 'd')
export const fullDate = (dateStr: string) => format(parseISO(dateStr), 'EEEE, MMMM d')
export const shortDate = (dateStr: string) => format(parseISO(dateStr), 'MMM d')
export const monthLabel = (d: Date) => format(d, 'MMMM yyyy')

export function isTodayIso(dateStr: string) {
  return isToday(parseISO(dateStr))
}

export function isSameIso(a: string, b: Date) {
  return isSameDay(parseISO(a), b)
}

export { addDays, format, startOfWeek, parseISO }
