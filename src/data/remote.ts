import { supabase } from '@/lib/supabase'
import { buildStarter, type Starter } from './starter'
import type {
  Announcement,
  AppNotification,
  AuditEntry,
  BadgeDef,
  ChatThread,
  Company,
  Department,
  Employee,
  LeaveRequest,
  Location,
  Position,
  Recognition,
  ReferenceData,
  Shift,
  SwapRequest,
} from './types'

/** The company all write operations are scoped to. Set by the store on load/switch. */
let activeCompany = 'c-demo'
export const setActiveCompany = (id: string) => {
  activeCompany = id
}

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

const toEmployee = (r: any): Employee => ({
  id: r.id,
  name: r.name,
  firstName: r.first_name ?? String(r.name).split(' ')[0],
  avatar: r.avatar ?? '',
  imgIndex: r.img_index ?? 1,
  role: r.role ?? 'employee',
  positionId: r.position_id,
  departmentId: r.department_id,
  homeLocationId: r.home_location_id,
  email: r.email ?? '',
  phone: r.phone ?? '',
  skills: r.skills ?? [],
  certifications: r.certifications ?? [],
  badges: r.badges ?? [],
  status: 'scheduled',
  punctuality: r.punctuality ?? 90,
  streak: r.streak ?? 0,
  hoursThisWeek: Number(r.hours_this_week ?? 0),
  rating: Number(r.rating ?? 4.5),
  startedAt: r.started_at ?? '2024-01-01',
  birthday: r.birthday ?? '1996-01-01',
  bio: r.bio ?? '',
  availability: r.availability ?? {
    preferred: 30, min: 12, max: 40, windows: {}, unavailableDates: [], vacationMode: false, preferredLocationIds: [],
  },
})

const toPosition = (r: any): Position => ({ id: r.id, name: r.name, departmentId: r.department_id, rate: Number(r.rate ?? 18) })
const toDepartment = (r: any): Department => ({ id: r.id, name: r.name, key: r.key })
const toLocation = (r: any): Location => ({
  id: r.id, name: r.name, short: r.short, address: r.address ?? '', region: r.region ?? '',
  map: { x: r.map_x ?? 50, y: r.map_y ?? 50 }, color: r.color ?? '245 68% 60%', headcountTarget: r.headcount_target ?? 3,
})
const toBadge = (r: any): BadgeDef => ({ id: r.id, name: r.name, description: r.description ?? '', icon: r.icon ?? 'Award', color: r.color ?? '245 68% 60%' })
const toCompany = (r: any): Company => ({
  id: r.id, name: r.name, slug: r.slug ?? '', joinCode: r.join_code ?? '', accent: r.accent ?? '245 68% 60%',
  ownerEmployeeId: r.owner_employee_id ?? null, createdAt: r.created_at,
})
const toAudit = (r: any): AuditEntry => ({
  id: r.id, companyId: r.company_id, actorId: r.actor_id ?? null, action: r.action, entity: r.entity ?? '',
  entityId: r.entity_id ?? null, summary: r.summary ?? '', createdAt: r.created_at,
})

/* ---- App → row mappers (for company creation) ---- */

const deptRow = (d: Department, cid: string) => ({ id: d.id, name: d.name, key: d.key, company_id: cid })
const posRow = (p: Position, cid: string) => ({ id: p.id, name: p.name, department_id: p.departmentId, rate: p.rate, company_id: cid })
const locRow = (l: Location, cid: string) => ({
  id: l.id, name: l.name, short: l.short, address: l.address, region: l.region,
  map_x: l.map.x, map_y: l.map.y, color: l.color, headcount_target: l.headcountTarget, company_id: cid,
})
const empRow = (e: Employee, cid: string) => ({
  id: e.id, name: e.name, first_name: e.firstName, avatar: e.avatar, img_index: e.imgIndex, role: e.role,
  position_id: e.positionId, department_id: e.departmentId, home_location_id: e.homeLocationId, email: e.email,
  phone: e.phone, skills: e.skills, certifications: e.certifications, badges: e.badges, punctuality: e.punctuality,
  streak: e.streak, hours_this_week: e.hoursThisWeek, rating: e.rating, started_at: e.startedAt, birthday: e.birthday,
  bio: e.bio, availability: e.availability, company_id: cid,
})
const shiftRow = (s: Shift, cid: string) => ({
  id: s.id, date: s.date, start_min: s.start, end_min: s.end, employee_id: s.employeeId, position_id: s.positionId,
  department_id: s.departmentId, location_id: s.locationId, status: s.status, required_skills: s.requiredSkills,
  note: s.note ?? null, distance_mi: s.distanceMi ?? null, break_min: s.breakMin ?? 0, company_id: cid,
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

const log = (label: string, error: unknown) => error && console.error(`[supabase] ${label}`, error)

/* ---- Reads ---- */

export async function fetchCompanies(): Promise<Company[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: true })
  log('fetchCompanies', error)
  return (data ?? []).map(toCompany)
}

export async function fetchReference(companyId: string): Promise<ReferenceData | null> {
  if (!supabase) return null
  const [emp, pos, dep, loc, bad] = await Promise.all([
    supabase.from('employees').select('*').eq('company_id', companyId),
    supabase.from('positions').select('*').eq('company_id', companyId),
    supabase.from('departments').select('*').eq('company_id', companyId),
    supabase.from('locations').select('*').eq('company_id', companyId),
    supabase.from('badges').select('*').eq('company_id', companyId),
  ])
  return {
    employees: (emp.data ?? []).map(toEmployee),
    positions: (pos.data ?? []).map(toPosition),
    departments: (dep.data ?? []).map(toDepartment),
    locations: (loc.data ?? []).map(toLocation),
    badges: (bad.data ?? []).map(toBadge),
  }
}

export async function fetchOperational(companyId: string): Promise<OperationalData | null> {
  if (!supabase) return null
  const c = (q: any) => q.eq('company_id', companyId)
  const [shifts, swaps, leaves, notifications, announcements, threads, messages, recognition] = await Promise.all([
    c(supabase.from('shifts').select('*')),
    c(supabase.from('swap_requests').select('*')).order('created_at', { ascending: false }),
    c(supabase.from('leave_requests').select('*')).order('created_at', { ascending: false }),
    c(supabase.from('notifications').select('*')).order('created_at', { ascending: false }),
    c(supabase.from('announcements').select('*')).order('created_at', { ascending: false }),
    c(supabase.from('chat_threads').select('*')),
    c(supabase.from('chat_messages').select('*')).order('created_at', { ascending: true }),
    c(supabase.from('recognition').select('*')).order('created_at', { ascending: false }),
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

export async function fetchAudit(companyId: string): Promise<AuditEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(120)
  log('fetchAudit', error)
  return (data ?? []).map(toAudit)
}

/* ---- Company lifecycle ---- */

const ACCENTS = ['245 68% 60%', '22 90% 56%', '190 85% 45%', '280 65% 62%', '152 55% 45%', '356 72% 56%', '38 92% 50%']
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 20) || 'company'
const randCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

/** Create a new company with a ready-to-use starter org. Returns the starter (also persisted when Supabase is on). */
export async function createCompany(name: string, ownerName = 'You'): Promise<Starter> {
  const base = slugify(name)
  const cid = `c-${base}-${Math.random().toString(36).slice(2, 6)}`
  const accent = ACCENTS[Math.abs([...cid].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % ACCENTS.length]
  const starter = buildStarter(cid, name.trim() || 'New Company', `${base}-${cid.slice(-4)}`, randCode(), accent, ownerName, new Date())
  if (!supabase) return starter

  const { reference: ref, shifts, company } = starter
  await supabase.from('companies').insert({
    id: company.id, name: company.name, slug: company.slug, join_code: company.joinCode, accent: company.accent, owner_employee_id: company.ownerEmployeeId,
  })
  await supabase.from('departments').insert(ref.departments.map((d) => deptRow(d, cid)))
  await supabase.from('positions').insert(ref.positions.map((p) => posRow(p, cid)))
  await supabase.from('locations').insert(ref.locations.map((l) => locRow(l, cid)))
  await supabase.from('employees').insert(ref.employees.map((e) => empRow(e, cid)))
  if (shifts.length) await supabase.from('shifts').insert(shifts.map((s) => shiftRow(s, cid)))
  return starter
}

export async function joinCompany(code: string): Promise<Company | null> {
  if (!supabase) return null
  const { data } = await supabase.from('companies').select('*').eq('join_code', code.trim().toUpperCase()).maybeSingle()
  return data ? toCompany(data) : null
}

/* ---- Write-through operations (fire-and-forget from the store) ---- */

export const remote = {
  updateShift: async (id: string, patch: Record<string, unknown>) => {
    if (!supabase) return
    log('updateShift', (await supabase.from('shifts').update(patch).eq('id', id)).error)
  },
  insertSwap: async (row: SwapRequest) => {
    if (!supabase) return
    log('insertSwap', (await supabase.from('swap_requests').insert({
      id: row.id, shift_id: row.shiftId, from_employee_id: row.fromEmployeeId, to_employee_id: row.toEmployeeId,
      kind: row.kind, status: row.status, created_at: row.createdAt, message: row.message ?? null, company_id: activeCompany,
    })).error)
  },
  updateSwap: async (id: string, status: SwapRequest['status']) => {
    if (!supabase) return
    log('updateSwap', (await supabase.from('swap_requests').update({ status }).eq('id', id)).error)
  },
  insertLeave: async (row: LeaveRequest) => {
    if (!supabase) return
    log('insertLeave', (await supabase.from('leave_requests').insert({
      id: row.id, employee_id: row.employeeId, type: row.type, start_date: row.start, end_date: row.end,
      status: row.status, reason: row.reason, created_at: row.createdAt, days: row.days, company_id: activeCompany,
    })).error)
  },
  updateLeave: async (id: string, status: LeaveRequest['status']) => {
    if (!supabase) return
    log('updateLeave', (await supabase.from('leave_requests').update({ status }).eq('id', id)).error)
  },
  insertNotification: async (row: AppNotification) => {
    if (!supabase) return
    log('insertNotification', (await supabase.from('notifications').insert({
      id: row.id, kind: row.kind, title: row.title, body: row.body, created_at: row.createdAt, read: row.read, actor_id: row.actorId ?? null, company_id: activeCompany,
    })).error)
  },
  markRead: async (id: string) => {
    if (!supabase) return
    log('markRead', (await supabase.from('notifications').update({ read: true }).eq('id', id)).error)
  },
  markAllRead: async () => {
    if (!supabase) return
    log('markAllRead', (await supabase.from('notifications').update({ read: true }).eq('company_id', activeCompany).eq('read', false)).error)
  },
  insertMessage: async (threadId: string, msg: { id: string; senderId: string; body: string; createdAt: string }) => {
    if (!supabase) return
    log('insertMessage', (await supabase.from('chat_messages').insert({ id: msg.id, thread_id: threadId, sender_id: msg.senderId, body: msg.body, created_at: msg.createdAt, company_id: activeCompany })).error)
  },
  readThread: async (threadId: string) => {
    if (!supabase) return
    log('readThread', (await supabase.from('chat_threads').update({ unread: 0 }).eq('id', threadId)).error)
  },
  insertRecognition: async (row: Recognition) => {
    if (!supabase) return
    log('insertRecognition', (await supabase.from('recognition').insert({ id: row.id, from_id: row.fromId, to_id: row.toId, message: row.message, created_at: row.createdAt, reactions: row.reactions, company_id: activeCompany })).error)
  },
  writeAudit: async (row: AuditEntry) => {
    if (!supabase) return
    log('writeAudit', (await supabase.from('audit_log').insert({
      id: row.id, company_id: row.companyId, actor_id: row.actorId, action: row.action, entity: row.entity, entity_id: row.entityId, summary: row.summary, created_at: row.createdAt,
    })).error)
  },
}

/** Subscribe to realtime changes for a company; calls `onChange` (debounced) on any event. */
export function subscribeOperational(companyId: string, onChange: () => void) {
  const sb = supabase
  if (!sb) return () => {}
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(onChange, 300)
  }
  const filter = `company_id=eq.${companyId}`
  const tables = ['shifts', 'swap_requests', 'leave_requests', 'notifications', 'chat_messages', 'recognition', 'audit_log']
  const channel = sb.channel(`cadence-ops-${companyId}`)
  // NB: call .on() without reassigning `channel` — feeding Supabase's overloaded
  // return type back into itself in a loop makes tsc's type-checking explode.
  for (const table of tables) {
    channel.on('postgres_changes' as any, { event: '*', schema: 'public', table, filter }, debounced)
  }
  channel.subscribe()

  return () => {
    if (timer) clearTimeout(timer)
    sb.removeChannel(channel)
  }
}
