import { supabase } from '@/lib/supabase'
import type {
  Announcement,
  AppNotification,
  ChatThread,
  LeaveRequest,
  Recognition,
  Shift,
  SwapRequest,
} from './types'

/* ---- Row → app-type mappers ---- */

const toShift = (r: any): Shift => ({
  id: r.id,
  date: r.date,
  start: r.start_min,
  end: r.end_min,
  employeeId: r.employee_id,
  positionId: r.position_id,
  departmentId: r.department_id,
  locationId: r.location_id,
  status: r.status,
  requiredSkills: r.required_skills ?? [],
  note: r.note ?? undefined,
  distanceMi: r.distance_mi ?? undefined,
  breakMin: r.break_min ?? 0,
})

const toSwap = (r: any): SwapRequest => ({
  id: r.id,
  shiftId: r.shift_id,
  fromEmployeeId: r.from_employee_id,
  toEmployeeId: r.to_employee_id,
  kind: r.kind,
  status: r.status,
  createdAt: r.created_at,
  message: r.message ?? undefined,
})

const toLeave = (r: any): LeaveRequest => ({
  id: r.id,
  employeeId: r.employee_id,
  type: r.type,
  start: r.start_date,
  end: r.end_date,
  status: r.status,
  reason: r.reason ?? '',
  createdAt: r.created_at,
  days: r.days ?? 1,
})

const toNotification = (r: any): AppNotification => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body ?? '',
  createdAt: r.created_at,
  read: r.read ?? false,
  actorId: r.actor_id ?? undefined,
})

const toAnnouncement = (r: any): Announcement => ({
  id: r.id,
  authorId: r.author_id,
  title: r.title,
  body: r.body ?? '',
  createdAt: r.created_at,
  pinned: r.pinned ?? false,
  audience: r.audience ?? '',
})

const toRecognition = (r: any): Recognition => ({
  id: r.id,
  fromId: r.from_id,
  toId: r.to_id,
  message: r.message ?? '',
  createdAt: r.created_at,
  reactions: r.reactions ?? 0,
})

export interface OperationalData {
  shifts: Shift[]
  swaps: SwapRequest[]
  leaves: LeaveRequest[]
  notifications: AppNotification[]
  announcements: Announcement[]
  threads: ChatThread[]
  recognition: Recognition[]
}

/** Fetch all mutable operational data from Supabase. */
export async function fetchOperational(): Promise<OperationalData | null> {
  if (!supabase) return null
  const [shifts, swaps, leaves, notifications, announcements, threads, messages, recognition] = await Promise.all([
    supabase.from('shifts').select('*'),
    supabase.from('swap_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    supabase.from('chat_threads').select('*'),
    supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
    supabase.from('recognition').select('*').order('created_at', { ascending: false }),
  ])

  const msgsByThread = new Map<string, any[]>()
  for (const m of messages.data ?? []) {
    if (!msgsByThread.has(m.thread_id)) msgsByThread.set(m.thread_id, [])
    msgsByThread.get(m.thread_id)!.push(m)
  }

  return {
    shifts: (shifts.data ?? []).map(toShift),
    swaps: (swaps.data ?? []).map(toSwap),
    leaves: (leaves.data ?? []).map(toLeave),
    notifications: (notifications.data ?? []).map(toNotification),
    announcements: (announcements.data ?? []).map(toAnnouncement),
    recognition: (recognition.data ?? []).map(toRecognition),
    threads: (threads.data ?? []).map((t: any): ChatThread => ({
      id: t.id,
      kind: t.kind,
      name: t.name,
      participantIds: t.participant_ids ?? [],
      unread: t.unread ?? 0,
      messages: (msgsByThread.get(t.id) ?? []).map((m) => ({ id: m.id, senderId: m.sender_id, body: m.body, createdAt: m.created_at })),
    })),
  }
}

/* ---- Write-through operations (fire-and-forget from the store) ---- */

const log = (label: string, error: unknown) => error && console.error(`[supabase] ${label}`, error)

export const remote = {
  updateShift: async (id: string, patch: Record<string, unknown>) => {
    if (!supabase) return
    const { error } = await supabase.from('shifts').update(patch).eq('id', id)
    log('updateShift', error)
  },
  insertSwap: async (row: SwapRequest) => {
    if (!supabase) return
    const { error } = await supabase.from('swap_requests').insert({
      id: row.id, shift_id: row.shiftId, from_employee_id: row.fromEmployeeId, to_employee_id: row.toEmployeeId,
      kind: row.kind, status: row.status, created_at: row.createdAt, message: row.message ?? null,
    })
    log('insertSwap', error)
  },
  updateSwap: async (id: string, status: SwapRequest['status']) => {
    if (!supabase) return
    log('updateSwap', (await supabase.from('swap_requests').update({ status }).eq('id', id)).error)
  },
  insertLeave: async (row: LeaveRequest) => {
    if (!supabase) return
    const { error } = await supabase.from('leave_requests').insert({
      id: row.id, employee_id: row.employeeId, type: row.type, start_date: row.start, end_date: row.end,
      status: row.status, reason: row.reason, created_at: row.createdAt, days: row.days,
    })
    log('insertLeave', error)
  },
  updateLeave: async (id: string, status: LeaveRequest['status']) => {
    if (!supabase) return
    log('updateLeave', (await supabase.from('leave_requests').update({ status }).eq('id', id)).error)
  },
  insertNotification: async (row: AppNotification) => {
    if (!supabase) return
    const { error } = await supabase.from('notifications').insert({
      id: row.id, kind: row.kind, title: row.title, body: row.body, created_at: row.createdAt, read: row.read, actor_id: row.actorId ?? null,
    })
    log('insertNotification', error)
  },
  markRead: async (id: string) => {
    if (!supabase) return
    log('markRead', (await supabase.from('notifications').update({ read: true }).eq('id', id)).error)
  },
  markAllRead: async () => {
    if (!supabase) return
    log('markAllRead', (await supabase.from('notifications').update({ read: true }).eq('read', false)).error)
  },
  insertMessage: async (threadId: string, msg: { id: string; senderId: string; body: string; createdAt: string }) => {
    if (!supabase) return
    const { error } = await supabase.from('chat_messages').insert({ id: msg.id, thread_id: threadId, sender_id: msg.senderId, body: msg.body, created_at: msg.createdAt })
    log('insertMessage', error)
  },
  readThread: async (threadId: string) => {
    if (!supabase) return
    log('readThread', (await supabase.from('chat_threads').update({ unread: 0 }).eq('id', threadId)).error)
  },
  insertRecognition: async (row: Recognition) => {
    if (!supabase) return
    const { error } = await supabase.from('recognition').insert({ id: row.id, from_id: row.fromId, to_id: row.toId, message: row.message, created_at: row.createdAt, reactions: row.reactions })
    log('insertRecognition', error)
  },
}

/** Subscribe to realtime changes on the operational tables; calls `onChange` (debounced) on any event. */
export function subscribeOperational(onChange: () => void) {
  const sb = supabase
  if (!sb) return () => {}
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(onChange, 300)
  }
  const channel = sb
    .channel('cadence-operational')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'recognition' }, debounced)
    .subscribe()

  return () => {
    if (timer) clearTimeout(timer)
    sb.removeChannel(channel)
  }
}
