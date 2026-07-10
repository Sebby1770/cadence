import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  ANNOUNCEMENTS,
  CHAT_THREADS,
  CURRENT_USER_ID,
  DEMO_COMPANY,
  LEAVE_REQUESTS,
  NOTIFICATIONS,
  RECOGNITION,
  SHIFTS,
  SWAP_REQUESTS,
  setReferenceData,
} from '@/data/mock'
import { isSupabaseEnabled } from '@/lib/supabase'
import {
  createCompany as apiCreateCompany,
  joinCompany as apiJoinCompany,
  fetchAudit,
  fetchCompanies,
  fetchOperational,
  fetchReference,
  remote,
  setActiveCompany,
  subscribeOperational,
} from '@/data/remote'
import { getEmployee, positionName } from '@/data/selectors'
import type {
  Announcement,
  AppNotification,
  AuditAction,
  AuditEntry,
  ChatThread,
  Company,
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
let unsubscribe: (() => void) | null = null

interface StoreState {
  currentUserId: string
  role: Role
  backend: 'mock' | 'supabase'
  hydrated: boolean
  companies: Company[]
  activeCompanyId: string
  audit: AuditEntry[]
  shifts: Shift[]
  notifications: AppNotification[]
  swaps: SwapRequest[]
  leaves: LeaveRequest[]
  threads: ChatThread[]
  recognition: Recognition[]
  announcements: Announcement[]
  toasts: Toast[]
  clock: ClockState

  hydrate: () => Promise<void>
  startRealtime: () => void
  stopRealtime: () => void

  switchCompany: (id: string) => Promise<void>
  createCompany: (name: string) => Promise<Company | null>
  joinCompany: (code: string) => Promise<Company | null>

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
    (set, get) => {
      const logAudit = (action: AuditAction, entity: string, entityId: string | null, summary: string) => {
        const entry: AuditEntry = {
          id: uid('au'),
          companyId: get().activeCompanyId,
          actorId: get().currentUserId,
          action,
          entity,
          entityId,
          summary,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ audit: [entry, ...s.audit].slice(0, 200) }))
        remote.writeAudit(entry)
      }

      const refreshOps = async () => {
        const cid = get().activeCompanyId
        const [ops, audit] = await Promise.all([fetchOperational(cid), fetchAudit(cid)])
        if (ops) set({ ...ops, audit })
      }

      const restartRealtime = () => {
        unsubscribe?.()
        unsubscribe = null
        if (!isSupabaseEnabled) return
        unsubscribe = subscribeOperational(get().activeCompanyId, () => refreshOps())
      }

      const loadCompany = async (company: Company) => {
        const [ref, ops, audit] = await Promise.all([
          fetchReference(company.id),
          fetchOperational(company.id),
          fetchAudit(company.id),
        ])
        // Only adopt this company's identity if we actually loaded its team —
        // otherwise keep the current (valid) user so pages never see a missing user.
        const emps = ref && ref.employees.length ? ref.employees : null
        if (emps) setReferenceData(ref!)
        const validUser =
          emps?.find((e) => e.id === company.ownerEmployeeId)?.id ?? emps?.[0]?.id ?? get().currentUserId
        setActiveCompany(company.id)
        set({
          activeCompanyId: company.id,
          currentUserId: validUser,
          audit,
          ...(ops ?? {}),
        })
        restartRealtime()
      }

      return {
        currentUserId: CURRENT_USER_ID,
        role: 'manager',
        backend: isSupabaseEnabled ? 'supabase' : 'mock',
        hydrated: !isSupabaseEnabled,
        companies: [DEMO_COMPANY],
        activeCompanyId: 'c-demo',
        audit: [],
        shifts: SHIFTS,
        notifications: NOTIFICATIONS,
        swaps: SWAP_REQUESTS,
        leaves: LEAVE_REQUESTS,
        threads: CHAT_THREADS,
        recognition: RECOGNITION,
        announcements: ANNOUNCEMENTS,
        toasts: [],
        clock: initialClock,

        hydrate: async () => {
          if (!isSupabaseEnabled) {
            set({ companies: [DEMO_COMPANY], hydrated: true })
            return
          }
          const companies = await fetchCompanies()
          if (!companies.length) {
            set({ hydrated: true })
            return
          }
          const active = companies.find((c) => c.id === get().activeCompanyId) ?? companies[0]
          await loadCompany(active)
          set({ companies, hydrated: true })
        },
        startRealtime: () => restartRealtime(),
        stopRealtime: () => {
          unsubscribe?.()
          unsubscribe = null
        },

        switchCompany: async (id) => {
          const company = get().companies.find((c) => c.id === id)
          if (!company || id === get().activeCompanyId) return
          await loadCompany(company)
          get().addToast({ title: `Switched to ${company.name}`, kind: 'info' })
        },

        createCompany: async (name) => {
          const starter = await apiCreateCompany(name)
          const c = starter.company
          setReferenceData(starter.reference)
          setActiveCompany(c.id)
          const welcome: AppNotification = {
            id: uid('n'),
            kind: 'announcement',
            title: 'Welcome to Cadence',
            body: `“${c.name}” is ready. Add your team, then build your first schedule.`,
            createdAt: new Date().toISOString(),
            read: false,
          }
          const entry: AuditEntry = {
            id: uid('au'), companyId: c.id, actorId: c.ownerEmployeeId, action: 'company.create',
            entity: 'company', entityId: c.id, summary: `Created workspace “${c.name}”`, createdAt: new Date().toISOString(),
          }
          set((s) => ({
            companies: [...s.companies.filter((x) => x.id !== c.id), c],
            activeCompanyId: c.id,
            currentUserId: c.ownerEmployeeId ?? CURRENT_USER_ID,
            shifts: starter.shifts,
            swaps: [], leaves: [], notifications: [welcome], threads: [], recognition: [], announcements: [], audit: [entry],
          }))
          remote.writeAudit(entry)
          restartRealtime()
          get().addToast({ title: `${c.name} is ready 🎉`, description: `Invite teammates with code ${c.joinCode}`, kind: 'success' })
          return c
        },

        joinCompany: async (code) => {
          const company = await apiJoinCompany(code)
          if (!company) {
            get().addToast({ title: 'No workspace found', description: 'Double-check the invite code.', kind: 'error' })
            return null
          }
          if (!get().companies.find((c) => c.id === company.id)) {
            set((s) => ({ companies: [...s.companies, company] }))
          }
          await loadCompany(company)
          logAudit('member.join', 'company', company.id, `Joined ${company.name}`)
          get().addToast({ title: `Joined ${company.name}`, kind: 'success' })
          return company
        },

        setRole: (role) => set({ role }),

        addToast: (t) => {
          const id = uid('toast')
          set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
          setTimeout(() => get().dismissToast(id), 4200)
        },
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

        pickUpShift: (shiftId) => {
          const me = get().currentUserId
          const shift = get().shifts.find((s) => s.id === shiftId)
          const note: AppNotification = {
            id: uid('n'),
            kind: 'shift-picked',
            title: 'Shift pick-up requested',
            body: 'You requested an open shift. Awaiting manager approval.',
            createdAt: new Date().toISOString(),
            read: false,
          }
          set((s) => ({
            shifts: s.shifts.map((sh) => (sh.id === shiftId ? { ...sh, employeeId: me, status: 'pending' as const } : sh)),
            notifications: [note, ...s.notifications],
          }))
          get().addToast({ title: 'Shift request sent', description: 'Your manager will confirm shortly.', kind: 'success' })
          remote.updateShift(shiftId, { employee_id: me, status: 'pending' })
          remote.insertNotification(note)
          logAudit('shift.pickup', 'shift', shiftId, `Requested a ${shift ? positionName(shift.positionId) : ''} shift`.trim())
        },

        releaseShift: (shiftId) => {
          set((s) => ({
            shifts: s.shifts.map((sh) => (sh.id === shiftId ? { ...sh, employeeId: null, status: 'open' as const } : sh)),
          }))
          remote.updateShift(shiftId, { employee_id: null, status: 'open' })
          logAudit('shift.release', 'shift', shiftId, 'Released a shift to the marketplace')
        },

        moveShift: (shiftId, newDate) => {
          const shift = get().shifts.find((sh) => sh.id === shiftId)
          if (!shift || shift.date === newDate) return
          set((s) => ({ shifts: s.shifts.map((sh) => (sh.id === shiftId ? { ...sh, date: newDate, status: 'draft' as const } : sh)) }))
          get().addToast({ title: 'Shift rescheduled', description: 'Remember to re-publish the roster.', kind: 'success' })
          remote.updateShift(shiftId, { date: newDate, status: 'draft' })
          logAudit('shift.move', 'shift', shiftId, `Rescheduled a ${positionName(shift.positionId)} shift to ${newDate}`)
        },

        assignShift: (shiftId, employeeId) => {
          const status = employeeId ? 'draft' : 'open'
          set((s) => ({ shifts: s.shifts.map((sh) => (sh.id === shiftId ? { ...sh, employeeId, status: status as Shift['status'] } : sh)) }))
          remote.updateShift(shiftId, { employee_id: employeeId, status })
          const who = employeeId ? getEmployee(employeeId)?.firstName ?? 'a teammate' : null
          logAudit('shift.assign', 'shift', shiftId, who ? `Assigned a shift to ${who}` : 'Unassigned a shift')
        },

        offerShift: (shiftId, kind, toEmployeeId = null, message) => {
          const swap: SwapRequest = {
            id: uid('sw'),
            shiftId,
            fromEmployeeId: get().currentUserId,
            toEmployeeId,
            kind,
            status: 'pending',
            createdAt: new Date().toISOString(),
            message,
          }
          set((s) => ({ swaps: [swap, ...s.swaps] }))
          get().addToast({ title: 'Shift offered', description: kind === 'offer-all' ? 'Offered to all qualified teammates.' : 'Your teammate has been notified.', kind: 'success' })
          remote.insertSwap(swap)
          logAudit('swap.offer', 'swap', swap.id, `Offered a shift (${kind.replace('-', ' ')})`)
        },

        respondToSwap: (swapId, accept) => {
          const me = get().currentUserId
          const swap = get().swaps.find((x) => x.id === swapId)
          const status = accept ? 'approved' : 'declined'
          set((s) => ({
            swaps: s.swaps.map((x) => (x.id === swapId ? { ...x, status } : x)),
            shifts: accept && swap ? s.shifts.map((sh) => (sh.id === swap.shiftId ? { ...sh, employeeId: me, status: 'confirmed' as const } : sh)) : s.shifts,
          }))
          get().addToast({ title: accept ? 'Swap accepted' : 'Swap declined', kind: accept ? 'success' : 'info' })
          remote.updateSwap(swapId, status)
          if (accept && swap) remote.updateShift(swap.shiftId, { employee_id: me, status: 'confirmed' })
          logAudit('swap.resolve', 'swap', swapId, `${accept ? 'Accepted' : 'Declined'} a swap`)
        },

        approveSwap: (swapId) => {
          set((s) => ({ swaps: s.swaps.map((x) => (x.id === swapId ? { ...x, status: 'approved' } : x)) }))
          get().addToast({ title: 'Swap approved', kind: 'success' })
          remote.updateSwap(swapId, 'approved')
          logAudit('swap.resolve', 'swap', swapId, 'Approved a swap request')
        },
        declineSwap: (swapId) => {
          set((s) => ({ swaps: s.swaps.map((x) => (x.id === swapId ? { ...x, status: 'declined' } : x)) }))
          get().addToast({ title: 'Swap declined', kind: 'info' })
          remote.updateSwap(swapId, 'declined')
          logAudit('swap.resolve', 'swap', swapId, 'Declined a swap request')
        },

        requestLeave: (input) => {
          const row: LeaveRequest = { id: uid('lr'), employeeId: get().currentUserId, status: 'pending', createdAt: new Date().toISOString(), ...input }
          set((s) => ({ leaves: [row, ...s.leaves] }))
          get().addToast({ title: 'Leave request submitted', description: 'You’ll be notified once it’s reviewed.', kind: 'success' })
          remote.insertLeave(row)
          logAudit('leave.request', 'leave', row.id, `Requested ${input.type} leave (${input.days}d)`)
        },
        approveLeave: (id) => {
          set((s) => ({ leaves: s.leaves.map((l) => (l.id === id ? { ...l, status: 'approved' } : l)) }))
          get().addToast({ title: 'Leave approved', kind: 'success' })
          remote.updateLeave(id, 'approved')
          logAudit('leave.resolve', 'leave', id, 'Approved a leave request')
        },
        declineLeave: (id) => {
          set((s) => ({ leaves: s.leaves.map((l) => (l.id === id ? { ...l, status: 'declined' } : l)) }))
          get().addToast({ title: 'Leave declined', kind: 'info' })
          remote.updateLeave(id, 'declined')
          logAudit('leave.resolve', 'leave', id, 'Declined a leave request')
        },

        notify: (n) => {
          const row: AppNotification = { id: uid('n'), createdAt: new Date().toISOString(), read: false, ...n }
          set((s) => ({ notifications: [row, ...s.notifications] }))
          remote.insertNotification(row)
        },
        markRead: (id) => {
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
          remote.markRead(id)
        },
        markAllRead: () => {
          set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
          remote.markAllRead()
        },

        sendMessage: (threadId, body) => {
          const msg = { id: uid('m'), senderId: get().currentUserId, body, createdAt: new Date().toISOString() }
          set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t)) }))
          remote.insertMessage(threadId, msg)
        },
        readThread: (threadId) => {
          set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)) }))
          remote.readThread(threadId)
        },

        addRecognition: (toId, message) => {
          const row: Recognition = { id: uid('r'), fromId: get().currentUserId, toId, message, createdAt: new Date().toISOString(), reactions: 0 }
          set((s) => ({ recognition: [row, ...s.recognition] }))
          get().addToast({ title: 'Recognition posted 🎉', kind: 'success' })
          remote.insertRecognition(row)
        },

        publishRoster: () => {
          get().addToast({ title: 'Roster published', description: 'The team has been notified.', kind: 'success' })
          logAudit('shift.publish', 'roster', null, 'Published the roster')
        },

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
      }
    },
    {
      name: 'cadence-store',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => persisted as Partial<StoreState>,
      partialize: (s) => ({ role: s.role, clock: s.clock, activeCompanyId: s.activeCompanyId }),
    },
  ),
)
