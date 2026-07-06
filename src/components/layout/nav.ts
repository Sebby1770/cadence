import {
  LayoutDashboard,
  CalendarDays,
  Store,
  Users,
  MapPin,
  MessagesSquare,
  CalendarClock,
  Plane,
  Timer,
  Bell,
  User,
  BarChart3,
  Shield,
  Sparkles,
  Repeat2,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/data/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles?: Role[]
  /** Show in the mobile bottom bar. */
  bottom?: boolean
  badgeKey?: 'notifications' | 'requests' | 'messages'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, bottom: true },
      { to: '/schedule', label: 'Schedule', icon: CalendarDays, bottom: true },
      { to: '/marketplace', label: 'Marketplace', icon: Store, bottom: true },
      { to: '/swaps', label: 'Shift Swaps', icon: Repeat2, badgeKey: 'requests' },
      { to: '/whos-working', label: "Who's Working", icon: Users },
    ],
  },
  {
    label: 'Team & Places',
    items: [
      { to: '/team', label: 'Team Directory', icon: Users },
      { to: '/locations', label: 'Locations', icon: MapPin },
      { to: '/messages', label: 'Messages', icon: MessagesSquare, bottom: true, badgeKey: 'messages' },
    ],
  },
  {
    label: 'Me',
    items: [
      { to: '/availability', label: 'Availability', icon: CalendarClock },
      { to: '/leave', label: 'Leave', icon: Plane },
      { to: '/clock', label: 'Time Clock', icon: Timer },
      { to: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
      { to: '/profile', label: 'Profile', icon: User, bottom: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['manager', 'admin'] },
      { to: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
    ],
  },
  {
    label: 'Assist',
    items: [{ to: '/assistant', label: 'AI Assistant', icon: Sparkles }],
  },
]

export const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items)

export const BOTTOM_ITEMS: NavItem[] = ALL_ITEMS.filter((i) => i.bottom)

export function visibleFor(role: Role, item: NavItem) {
  return !item.roles || item.roles.includes(role)
}
