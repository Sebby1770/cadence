import { createClient } from '@supabase/supabase-js'
import {
  DEPARTMENTS,
  POSITIONS,
  LOCATIONS,
  BADGES,
  EMPLOYEES,
  SHIFTS,
  SWAP_REQUESTS,
  LEAVE_REQUESTS,
  NOTIFICATIONS,
  ANNOUNCEMENTS,
  RECOGNITION,
  CHAT_THREADS,
} from '../src/data/mock'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')

const sb = createClient(url, key, { auth: { persistSession: false } })

async function push(table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400)
    const { error } = await sb.from(table).upsert(chunk, { onConflict: 'id' })
    if (error) {
      console.error(`✗ ${table} [${i}]:`, error.message)
      process.exitCode = 1
      return
    }
  }
  console.log(`✓ ${table}: ${rows.length}`)
}

async function main() {
  await push('departments', DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, key: d.key })))
  await push('locations', LOCATIONS.map((l) => ({ id: l.id, name: l.name, short: l.short, address: l.address, region: l.region, map_x: l.map.x, map_y: l.map.y, color: l.color, headcount_target: l.headcountTarget })))
  await push('positions', POSITIONS.map((p) => ({ id: p.id, name: p.name, department_id: p.departmentId, rate: p.rate })))
  await push('badges', BADGES.map((b) => ({ id: b.id, name: b.name, description: b.description, icon: b.icon, color: b.color })))
  await push('employees', EMPLOYEES.map((e) => ({
    id: e.id, name: e.name, first_name: e.firstName, avatar: e.avatar, img_index: e.imgIndex, role: e.role,
    position_id: e.positionId, department_id: e.departmentId, home_location_id: e.homeLocationId, email: e.email, phone: e.phone,
    skills: e.skills, certifications: e.certifications, badges: e.badges, punctuality: e.punctuality, streak: e.streak,
    hours_this_week: e.hoursThisWeek, rating: e.rating, started_at: e.startedAt, birthday: e.birthday, bio: e.bio, availability: e.availability,
  })))
  await push('shifts', SHIFTS.map((s) => ({
    id: s.id, date: s.date, start_min: s.start, end_min: s.end, employee_id: s.employeeId, position_id: s.positionId,
    department_id: s.departmentId, location_id: s.locationId, status: s.status, required_skills: s.requiredSkills,
    note: s.note ?? null, distance_mi: s.distanceMi ?? null, break_min: s.breakMin ?? 0,
  })))
  await push('swap_requests', SWAP_REQUESTS.map((s) => ({ id: s.id, shift_id: s.shiftId, from_employee_id: s.fromEmployeeId, to_employee_id: s.toEmployeeId, kind: s.kind, status: s.status, created_at: s.createdAt, message: s.message ?? null })))
  await push('leave_requests', LEAVE_REQUESTS.map((l) => ({ id: l.id, employee_id: l.employeeId, type: l.type, start_date: l.start, end_date: l.end, status: l.status, reason: l.reason, created_at: l.createdAt, days: l.days })))
  await push('announcements', ANNOUNCEMENTS.map((a) => ({ id: a.id, author_id: a.authorId, title: a.title, body: a.body, created_at: a.createdAt, pinned: a.pinned, audience: a.audience })))
  await push('notifications', NOTIFICATIONS.map((x) => ({ id: x.id, kind: x.kind, title: x.title, body: x.body, created_at: x.createdAt, read: x.read, actor_id: x.actorId ?? null })))
  await push('chat_threads', CHAT_THREADS.map((t) => ({ id: t.id, kind: t.kind, name: t.name, participant_ids: t.participantIds, unread: t.unread })))
  await push('chat_messages', CHAT_THREADS.flatMap((t) => t.messages.map((m) => ({ id: m.id, thread_id: t.id, sender_id: m.senderId, body: m.body, created_at: m.createdAt }))))
  await push('recognition', RECOGNITION.map((r) => ({ id: r.id, from_id: r.fromId, to_id: r.toId, message: r.message, created_at: r.createdAt, reactions: r.reactions })))
  console.log('Seed complete.')
}

main()
