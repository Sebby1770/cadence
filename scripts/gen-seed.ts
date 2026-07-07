import { writeFileSync, mkdirSync } from 'node:fs'
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

const q = (v: unknown) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const n = (v: unknown) => (v === null || v === undefined ? 'NULL' : String(v))
const b = (v: unknown) => (v ? 'true' : 'false')
const arr = (a: string[] | undefined) =>
  !a || a.length === 0 ? `'{}'::text[]` : `ARRAY[${a.map((x) => q(x)).join(',')}]::text[]`
const json = (o: unknown) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`
const row = (vals: string[]) => `(${vals.join(', ')})`

function table(name: string, cols: string[], rows: string[][]) {
  if (!rows.length) return ''
  return `insert into ${name} (${cols.join(', ')}) values\n${rows.map((r) => row(r)).join(',\n')}\non conflict (id) do nothing;\n`
}

const out: string[] = []

out.push(`-- Cadence seed — generated from the mock dataset\nbegin;\n`)
out.push(
  `truncate table chat_messages, chat_threads, recognition, notifications, announcements, leave_requests, swap_requests, shifts, employees, positions, badges, locations, departments restart identity cascade;\n`,
)

out.push(table('departments', ['id', 'name', 'key'], DEPARTMENTS.map((d) => [q(d.id), q(d.name), q(d.key)])))

out.push(
  table(
    'locations',
    ['id', 'name', 'short', 'address', 'region', 'map_x', 'map_y', 'color', 'headcount_target'],
    LOCATIONS.map((l) => [q(l.id), q(l.name), q(l.short), q(l.address), q(l.region), n(l.map.x), n(l.map.y), q(l.color), n(l.headcountTarget)]),
  ),
)

out.push(
  table(
    'positions',
    ['id', 'name', 'department_id', 'rate'],
    POSITIONS.map((p) => [q(p.id), q(p.name), q(p.departmentId), n(p.rate)]),
  ),
)

out.push(
  table(
    'badges',
    ['id', 'name', 'description', 'icon', 'color'],
    BADGES.map((x) => [q(x.id), q(x.name), q(x.description), q(x.icon), q(x.color)]),
  ),
)

out.push(
  table(
    'employees',
    ['id', 'name', 'first_name', 'avatar', 'img_index', 'role', 'position_id', 'department_id', 'home_location_id', 'email', 'phone', 'skills', 'certifications', 'badges', 'punctuality', 'streak', 'hours_this_week', 'rating', 'started_at', 'birthday', 'bio', 'availability'],
    EMPLOYEES.map((e) => [
      q(e.id), q(e.name), q(e.firstName), q(e.avatar), n(e.imgIndex), q(e.role), q(e.positionId), q(e.departmentId), q(e.homeLocationId),
      q(e.email), q(e.phone), arr(e.skills), arr(e.certifications), arr(e.badges), n(e.punctuality), n(e.streak), n(e.hoursThisWeek),
      n(e.rating), q(e.startedAt), q(e.birthday), q(e.bio), json(e.availability),
    ]),
  ),
)

out.push(
  table(
    'shifts',
    ['id', 'date', 'start_min', 'end_min', 'employee_id', 'position_id', 'department_id', 'location_id', 'status', 'required_skills', 'note', 'distance_mi', 'break_min'],
    SHIFTS.map((s) => [
      q(s.id), q(s.date), n(s.start), n(s.end), q(s.employeeId), q(s.positionId), q(s.departmentId), q(s.locationId), q(s.status),
      arr(s.requiredSkills), q(s.note ?? null), n(s.distanceMi), n(s.breakMin ?? 0),
    ]),
  ),
)

out.push(
  table(
    'swap_requests',
    ['id', 'shift_id', 'from_employee_id', 'to_employee_id', 'kind', 'status', 'created_at', 'message'],
    SWAP_REQUESTS.map((s) => [q(s.id), q(s.shiftId), q(s.fromEmployeeId), q(s.toEmployeeId), q(s.kind), q(s.status), q(s.createdAt), q(s.message ?? null)]),
  ),
)

out.push(
  table(
    'leave_requests',
    ['id', 'employee_id', 'type', 'start_date', 'end_date', 'status', 'reason', 'created_at', 'days'],
    LEAVE_REQUESTS.map((l) => [q(l.id), q(l.employeeId), q(l.type), q(l.start), q(l.end), q(l.status), q(l.reason), q(l.createdAt), n(l.days)]),
  ),
)

out.push(
  table(
    'announcements',
    ['id', 'author_id', 'title', 'body', 'created_at', 'pinned', 'audience'],
    ANNOUNCEMENTS.map((a) => [q(a.id), q(a.authorId), q(a.title), q(a.body), q(a.createdAt), b(a.pinned), q(a.audience)]),
  ),
)

out.push(
  table(
    'notifications',
    ['id', 'kind', 'title', 'body', 'created_at', 'read', 'actor_id'],
    NOTIFICATIONS.map((x) => [q(x.id), q(x.kind), q(x.title), q(x.body), q(x.createdAt), b(x.read), q(x.actorId ?? null)]),
  ),
)

out.push(
  table(
    'chat_threads',
    ['id', 'kind', 'name', 'participant_ids', 'unread'],
    CHAT_THREADS.map((t) => [q(t.id), q(t.kind), q(t.name), arr(t.participantIds), n(t.unread)]),
  ),
)

const msgs = CHAT_THREADS.flatMap((t) => t.messages.map((m) => [q(m.id), q(t.id), q(m.senderId), q(m.body), q(m.createdAt)]))
out.push(table('chat_messages', ['id', 'thread_id', 'sender_id', 'body', 'created_at'], msgs))

out.push(
  table(
    'recognition',
    ['id', 'from_id', 'to_id', 'message', 'created_at', 'reactions'],
    RECOGNITION.map((r) => [q(r.id), q(r.fromId), q(r.toId), q(r.message), q(r.createdAt), n(r.reactions)]),
  ),
)

out.push('commit;\n')

mkdirSync('supabase', { recursive: true })
const sql = out.filter(Boolean).join('\n')
writeFileSync('supabase/seed.sql', sql)
console.log(`Wrote supabase/seed.sql (${sql.length} bytes, ${SHIFTS.length} shifts, ${EMPLOYEES.length} employees)`)
