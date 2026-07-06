import {
  Clock,
  HeartHandshake,
  Zap,
  CalendarCheck,
  Shuffle,
  GraduationCap,
  Flame,
  Sunrise,
  Award,
  type LucideIcon,
} from 'lucide-react'

/** Map badge `icon` names (from BADGES) to their components, without pulling in all of lucide. */
const MAP: Record<string, LucideIcon> = {
  Clock,
  HeartHandshake,
  Zap,
  CalendarCheck,
  Shuffle,
  GraduationCap,
  Flame,
  Sunrise,
  Award,
}

export function badgeIcon(name: string): LucideIcon {
  return MAP[name] ?? Award
}
