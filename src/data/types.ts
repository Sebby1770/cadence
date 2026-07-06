export type Role = 'employee' | 'manager' | 'admin'

export type DeptKey = 'floor' | 'kitchen' | 'bar' | 'sales' | 'support' | 'management'

export type WorkStatus = 'working' | 'break' | 'off' | 'finished' | 'scheduled'

export type ShiftStatus =
  | 'published'
  | 'draft'
  | 'open'
  | 'pending'
  | 'swap'
  | 'confirmed'

export interface Department {
  id: string
  name: string
  key: DeptKey
}

export interface Position {
  id: string
  name: string
  departmentId: string
  /** Base hourly pay rate in USD. */
  rate: number
}

export interface Location {
  id: string
  name: string
  short: string
  address: string
  region: string
  /** Position on the stylized city map, 0-100. */
  map: { x: number; y: number }
  color: string
  headcountTarget: number
}

export interface Availability {
  /** Preferred weekly hours. */
  preferred: number
  min: number
  max: number
  /** 0=Sun..6=Sat -> [startMin, endMin] windows the person can work. */
  windows: Record<number, [number, number] | null>
  unavailableDates: string[]
  vacationMode: boolean
  preferredLocationIds: string[]
}

export interface Employee {
  id: string
  name: string
  firstName: string
  avatar: string
  imgIndex: number
  role: Role
  positionId: string
  departmentId: string
  homeLocationId: string
  email: string
  phone: string
  skills: string[]
  certifications: string[]
  badges: string[]
  status: WorkStatus
  /** Punctuality percentage 0-100. */
  punctuality: number
  streak: number
  hoursThisWeek: number
  rating: number
  startedAt: string
  birthday: string
  availability: Availability
  bio: string
}

export interface Shift {
  id: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Minutes since midnight. */
  start: number
  end: number
  employeeId: string | null
  positionId: string
  departmentId: string
  locationId: string
  status: ShiftStatus
  requiredSkills: string[]
  note?: string
  /** Distance (mi) from the current user's home location — for the marketplace. */
  distanceMi?: number
  breakMin?: number
}

export interface SwapRequest {
  id: string
  shiftId: string
  fromEmployeeId: string
  toEmployeeId: string | null
  kind: 'swap' | 'offer-all' | 'offer-selected'
  status: 'pending' | 'approved' | 'declined'
  createdAt: string
  message?: string
}

export type LeaveType = 'annual' | 'sick' | 'personal' | 'study' | 'other'

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  start: string
  end: string
  status: 'pending' | 'approved' | 'declined'
  reason: string
  createdAt: string
  days: number
}

export type NotificationKind =
  | 'shift-approved'
  | 'shift-picked'
  | 'swap'
  | 'announcement'
  | 'roster'
  | 'leave'
  | 'reminder'
  | 'badge'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
  actorId?: string
}

export interface Announcement {
  id: string
  authorId: string
  title: string
  body: string
  createdAt: string
  pinned: boolean
  audience: string
}

export interface ChatMessage {
  id: string
  senderId: string
  body: string
  createdAt: string
}

export interface ChatThread {
  id: string
  kind: 'direct' | 'group' | 'store' | 'department' | 'shift'
  name: string
  participantIds: string[]
  messages: ChatMessage[]
  unread: number
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export interface Recognition {
  id: string
  fromId: string
  toId: string
  message: string
  createdAt: string
  reactions: number
}
