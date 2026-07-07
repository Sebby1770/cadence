import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  ANNOUNCEMENTS,
  CHAT_THREADS,
  CURRENT_USER_ID,
  LEAVE_REQUESTS,
  NOTIFICATIONS,
  RECOGNITION,
  SHIFTS,
  SWAP_REQUESTS,
} from '@/data/mock'
import type {
  Announcement,
  AppNotification,
  ChatThread,
  LeaveRequest,
  LeaveType,
  NotificationKind,
  Recognition,
  Role,
  Shift,
  SwapRequest,
} from '@/data/types'

export interface Toast {
  id: string
  title: string
  description?: string
  kind: 'success' | 'info' | 'warning' | 'error'
}

export interface ClockState {
  clockedIn: boolean
  onBreak: boolean
  since: number | null
  breakSince: number | null
  breakTotal: number
  locationId: string | null
}

let seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`

interface StoreState {
  currentUserId: string
  role: Role
  shifts: Shift[]
  notifications: AppNotification[]
  swaps: SwapRequest[]
  leaves: LeaveRequest[]
  threads: ChatThread[]
  recognition: Recognition[]
  announcements: Announcement[]
  toasts: Toast[]
  clock: ClockState

  setRole: (role: Role) => void
  addToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void

  pickUpShift: (shiftId: string) => void
  releaseShift: (shiftId: string) => void
  moveShift: (shiftId: string, newDate: string) => void
  assignShift: (shiftId: string, employeeId: string | null) => void
  offerShift: (shiftId: string, kind: SwapRequest['kind'], toEmployeeId?: string | null, message?: string) => void
  respondToSwap: (swapId: string, accept: boolean) => void
  approveSwap: (swapId: string) => void
  declineSwap: (swapId: string) => void

  requestLeave: (input: { type: LeaveType; start: string; end: string; reason: string; days: number }) => void
  approveLeave: (id: string) => void
  declineLeave: (id: string) => void

  notify: (n: { kind: NotificationKind; title: string; body: string; actorId?: string }) => void
  markRead: (id: string) => void
  markAllRead: () => void

  sendMessage: (threadId: string, body: string) => void
  readThread: (threadId: string) => void
  addRecognition: (toId: string, message: string) => void
  publishRoster: () => void

  clockIn: (locationId: string) => void
  clockOut: () => void
  toggleBreak: () => void
}

const initialClock: ClockState = {
  clockedIn: false,
  onBreak: false,
  since: null,
  breakSince: null,
  breakTotal: 0,
  locationId: null,
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUserId: CURRENT_USER_ID,
      role: 'manager',
      shifts: SHIFTS,
      notifications: NOTIFICATIONS,
      swaps: SWAP_REQUESTS,
      leaves: LEAVE_REQUESTS,
      threads: CHAT_THREADS,
      recognition: RECOGNITION,
      announcements: ANNOUNCEMENTS,
      toasts: [],
      clock: initialClock,

      setRole: (role) => set({ role }),

      addToast: (t) => {
        const id = uid('toast')
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
        setTimeout(() => get().dismissToast(id), 4200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

      pickUpShift: (shiftId) =>
        set((s) => {
          const shifts = s.shifts.map((sh) =>
            sh.id === shiftId ? { ...sh, employeeId: s.currentUserId, status: 'pending' as const } : sh,
          )
          get().addToast({ title: 'Shift request sent', description: 'Your manager will confirm shortly.', kind: 'success' })
          return {
            shifts,
            notifications: [
              {
                id: uid('n'),
                kind: 'shift-picked',
                title: 'Shift pick-up requested',
                body: 'You requested an open shift. Awaiting manager approval.',
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...s.notifications,
            ],
          }
        }),

      releaseShift: (shiftId) =>
        set((s) => ({
          shifts: s.shifts.map((sh) =>
            sh.id === shiftId ? { ...sh, employeeId: null, status: 'open' as const } : sh,
          ),
        })),

      moveShift: (shiftId, newDate) =>
        set((s) => {
          const shift = s.shifts.find((sh) => sh.id === shiftId)
          if (!shift || shift.date === newDate) return {}
          get().addToast({ title: 'Shift rescheduled', description: 'Remember to re-publish the roster.', kind: 'success' })
          return { shifts: s.shifts.map((sh) => (sh.id === shiftId ? { ...sh, date: newDate, status: 'draft' as const } : sh)) }
        }),

      assignShift: (shiftId, employeeId) =>
        set((s) => ({
          shifts: s.shifts.map((sh) =>
            sh.id === shiftId
              ? { ...sh, employeeId, status: employeeId ? ('draft' as const) : ('open' as const) }
              : sh,
          ),
        })),

      offerShift: (shiftId, kind, toEmployeeId = null, message) => {
        set((s) => ({
          swaps: [
            {
              id: uid('sw'),
              shiftId,
              fromEmployeeId: s.currentUserId,
              toEmployeeId,
              kind,
              status: 'pending',
              createdAt: new Date().toISOString(),
              message,
            },
            ...s.swaps,
          ],
        }))
        get().addToast({ title: 'Shift offered', description: kind === 'offer-all' ? 'Offered to all qualified teammates.' : 'Your teammate has been notified.', kind: 'success' })
      },

      respondToSwap: (swapId, accept) =>
        set((s) => {
          const swap = s.swaps.find((x) => x.id === swapId)
          get().addToast({
            title: accept ? 'Swap accepted' : 'Swap declined',
            kind: accept ? 'success' : 'info',
          })
          return {
            swaps: s.swaps.map((x) => (x.id === swapId ? { ...x, status: accept ? 'approved' : 'declined' } : x)),
            shifts:
              accept && swap
                ? s.shifts.map((sh) => (sh.id === swap.shiftId ? { ...sh, employeeId: s.currentUserId, status: 'confirmed' as const } : sh))
                : s.shifts,
          }
        }),

      approveSwap: (swapId) => {
        set((s) => ({ swaps: s.swaps.map((x) => (x.id === swapId ? { ...x, status: 'approved' } : x)) }))
        get().addToast({ title: 'Swap approved', kind: 'success' })
      },
      declineSwap: (swapId) => {
        set((s) => ({ swaps: s.swaps.map((x) => (x.id === swapId ? { ...x, status: 'declined' } : x)) }))
        get().addToast({ title: 'Swap declined', kind: 'info' })
      },

      requestLeave: (input) => {
        set((s) => ({
          leaves: [
            { id: uid('lr'), employeeId: s.currentUserId, status: 'pending', createdAt: new Date().toISOString(), ...input },
            ...s.leaves,
          ],
        }))
        get().addToast({ title: 'Leave request submitted', description: 'You’ll be notified once it’s reviewed.', kind: 'success' })
      },
      approveLeave: (id) => {
        set((s) => ({ leaves: s.leaves.map((l) => (l.id === id ? { ...l, status: 'approved' } : l)) }))
        get().addToast({ title: 'Leave approved', kind: 'success' })
      },
      declineLeave: (id) => {
        set((s) => ({ leaves: s.leaves.map((l) => (l.id === id ? { ...l, status: 'declined' } : l)) }))
        get().addToast({ title: 'Leave declined', kind: 'info' })
      },

      notify: (n) =>
        set((s) => ({
          notifications: [
            { id: uid('n'), createdAt: new Date().toISOString(), read: false, ...n },
            ...s.notifications,
          ],
        })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      sendMessage: (threadId, body) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [...t.messages, { id: uid('m'), senderId: s.currentUserId, body, createdAt: new Date().toISOString() }],
                }
              : t,
          ),
        })),
      readThread: (threadId) =>
        set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)) })),

      addRecognition: (toId, message) => {
        set((s) => ({
          recognition: [
            { id: uid('r'), fromId: s.currentUserId, toId, message, createdAt: new Date().toISOString(), reactions: 0 },
            ...s.recognition,
          ],
        }))
        get().addToast({ title: 'Recognition posted 🎉', kind: 'success' })
      },

      publishRoster: () => get().addToast({ title: 'Roster published', description: 'The team has been notified.', kind: 'success' }),

      clockIn: (locationId) => {
        set({ clock: { ...initialClock, clockedIn: true, since: Date.now(), locationId } })
        get().addToast({ title: 'Clocked in', description: 'Have a great shift!', kind: 'success' })
      },
      clockOut: () => {
        set({ clock: initialClock })
        get().addToast({ title: 'Clocked out', description: 'Hours recorded. See you next time.', kind: 'info' })
      },
      toggleBreak: () =>
        set((s) => {
          const c = s.clock
          if (!c.clockedIn) return {}
          if (c.onBreak) {
            const added = c.breakSince ? Date.now() - c.breakSince : 0
            return { clock: { ...c, onBreak: false, breakSince: null, breakTotal: c.breakTotal + added } }
          }
          return { clock: { ...c, onBreak: true, breakSince: Date.now() } }
        }),
    }),
    {
      name: 'cadence-store',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ role: s.role, clock: s.clock }),
    },
  ),
)
