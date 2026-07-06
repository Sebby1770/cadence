import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with correct precedence. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as a currency string. */
export function currency(value: number, opts: { cents?: boolean } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(value)
}

/** Compact number formatting, e.g. 12400 -> 12.4k */
export function compact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Deterministic pseudo-random in [0,1) from a string seed (stable across renders). */
export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return ((h ^= h >>> 16) >>> 0) / 4294967296
}

/** Return initials from a full name. */
export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

/** Convert minutes since midnight to a readable time label, e.g. 540 -> "9:00 AM". */
export function minutesToLabel(mins: number) {
  const h24 = Math.floor(mins / 60) % 24
  const m = mins % 60
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

/** Human-friendly relative time from an ISO string or Date. */
export function relativeTime(input: string | Date, now = new Date()) {
  const then = typeof input === 'string' ? new Date(input) : input
  const diff = then.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return 'just now'
}

/** Pluralize a noun based on count. */
export function plural(count: number, noun: string, suffix = 's') {
  return `${count} ${noun}${count === 1 ? '' : suffix}`
}

/** Avatar URL from a stable seed — realistic headshots for the demo. */
export function avatarUrl(seed: number | string) {
  const n = typeof seed === 'number' ? seed : Math.floor(seededRandom(seed) * 70) + 1
  return `https://i.pravatar.cc/160?img=${(Number(n) % 70) + 1}`
}

/** Format hours as e.g. "38h 30m" or "38.5h". */
export function formatHours(hours: number, compactStyle = false) {
  if (compactStyle) return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
