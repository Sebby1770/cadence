import { addDays, format, startOfWeek } from 'date-fns'
import { avatarUrl, seededRandom } from '@/lib/utils'
import type {
  Announcement,
  AppNotification,
  BadgeDef,
  ChatThread,
  Department,
  Employee,
  LeaveRequest,
  Location,
  Position,
  Recognition,
  Role,
  Shift,
  SwapRequest,
} from './types'

/* ------------------------------------------------------------------ *
 *  Static reference data
 * ------------------------------------------------------------------ */

export const DEPARTMENTS: Department[] = [
  { id: 'd-floor', name: 'Floor & Café', key: 'floor' },
  { id: 'd-kitchen', name: 'Kitchen', key: 'kitchen' },
  { id: 'd-bar', name: 'Bar', key: 'bar' },
  { id: 'd-sales', name: 'Retail Sales', key: 'sales' },
  { id: 'd-support', name: 'Support', key: 'support' },
  { id: 'd-mgmt', name: 'Management', key: 'management' },
]

export const POSITIONS: Position[] = [
  { id: 'p-barista', name: 'Barista', departmentId: 'd-floor', rate: 19 },
  { id: 'p-server', name: 'Server', departmentId: 'd-floor', rate: 18 },
  { id: 'p-host', name: 'Host', departmentId: 'd-floor', rate: 17 },
  { id: 'p-cashier', name: 'Cashier', departmentId: 'd-floor', rate: 17.5 },
  { id: 'p-line', name: 'Line Cook', departmentId: 'd-kitchen', rate: 22 },
  { id: 'p-prep', name: 'Prep Cook', departmentId: 'd-kitchen', rate: 19 },
  { id: 'p-chef', name: 'Chef', departmentId: 'd-kitchen', rate: 31 },
  { id: 'p-bartender', name: 'Bartender', departmentId: 'd-bar', rate: 21 },
  { id: 'p-barback', name: 'Barback', departmentId: 'd-bar', rate: 18 },
  { id: 'p-sales', name: 'Sales Associate', departmentId: 'd-sales', rate: 20 },
  { id: 'p-keyholder', name: 'Key Holder', departmentId: 'd-sales', rate: 24 },
  { id: 'p-stock', name: 'Stock Associate', departmentId: 'd-support', rate: 18 },
  { id: 'p-cleaner', name: 'Cleaner', departmentId: 'd-support', rate: 17 },
  { id: 'p-lead', name: 'Shift Lead', departmentId: 'd-mgmt', rate: 28 },
  { id: 'p-manager', name: 'Store Manager', departmentId: 'd-mgmt', rate: 38 },
]

export const LOCATIONS: Location[] = [
  {
    id: 'l-flagship',
    name: 'Downtown Flagship',
    short: 'Flagship',
    address: '500 Market Street',
    region: 'Downtown',
    map: { x: 44, y: 40 },
    color: '245 68% 60%',
    headcountTarget: 14,
  },
  {
    id: 'l-marina',
    name: 'Marina Café',
    short: 'Marina',
    address: '2100 Chestnut Street',
    region: 'Marina',
    map: { x: 26, y: 20 },
    color: '190 85% 45%',
    headcountTarget: 8,
  },
  {
    id: 'l-airport',
    name: 'Airport Kiosk',
    short: 'Airport',
    address: 'SFO · Terminal 2',
    region: 'Airport',
    map: { x: 72, y: 74 },
    color: '22 90% 56%',
    headcountTarget: 6,
  },
  {
    id: 'l-bayview',
    name: 'Bayview Warehouse',
    short: 'Bayview',
    address: '1500 Innes Avenue',
    region: 'Bayview',
    map: { x: 80, y: 52 },
    color: '152 55% 45%',
    headcountTarget: 10,
  },
  {
    id: 'l-uptown',
    name: 'Uptown Store',
    short: 'Uptown',
    address: '780 Fillmore Street',
    region: 'Uptown',
    map: { x: 30, y: 58 },
    color: '280 65% 62%',
    headcountTarget: 9,
  },
]

export const BADGES: BadgeDef[] = [
  { id: 'b-punctual', name: 'Always On Time', description: '30 shifts with zero late clock-ins.', icon: 'Clock', color: '152 62% 42%' },
  { id: 'b-helper', name: 'Team Player', description: 'Covered 10+ shifts for coworkers.', icon: 'HeartHandshake', color: '356 72% 56%' },
  { id: 'b-pickup', name: 'Shift Hero', description: 'Picked up 15 open shifts.', icon: 'Zap', color: '38 92% 50%' },
  { id: 'b-perfect', name: 'Perfect Attendance', description: 'No absences for a full quarter.', icon: 'CalendarCheck', color: '245 68% 60%' },
  { id: 'b-flex', name: 'Most Flexible', description: 'Worked every shift type this month.', icon: 'Shuffle', color: '190 85% 45%' },
  { id: 'b-mentor', name: 'Mentor', description: 'Trained 5 new teammates.', icon: 'GraduationCap', color: '280 65% 62%' },
  { id: 'b-streak', name: 'On Fire', description: 'A 20-shift punctuality streak.', icon: 'Flame', color: '22 90% 56%' },
  { id: 'b-early', name: 'Early Bird', description: 'Master of the opening shift.', icon: 'Sunrise', color: '48 95% 52%' },
]

const SKILLS = [
  'POS', 'Latte Art', 'Cash Handling', 'Grill', 'Sauté', 'Wine Service', 'Cocktails',
  'Opening', 'Closing', 'Inventory', 'Customer Service', 'Food Safety', 'Forklift',
  'Merchandising', 'Training', 'Barista',
]
const CERTS = ['Food Handler', 'Alcohol Service (RSA)', 'First Aid', 'Barista Level 2', 'Forklift License', 'Fire Warden']

/* ------------------------------------------------------------------ *
 *  Employees
 * ------------------------------------------------------------------ */

type Seed = [name: string, departmentId: string, positionId: string, role?: Role]

const ROSTER: Seed[] = [
  ['Sebastian Reed', 'd-mgmt', 'p-lead', 'manager'],
  ['Nadia Petrova', 'd-mgmt', 'p-manager', 'manager'],
  ['Alex Rivera', 'd-mgmt', 'p-manager', 'admin'],
  ['Maya Chen', 'd-floor', 'p-barista'],
  ['Liam Novak', 'd-floor', 'p-server'],
  ['Aisha Khan', 'd-floor', 'p-host'],
  ['Diego Santos', 'd-floor', 'p-cashier'],
  ['Emma Wilson', 'd-floor', 'p-barista'],
  ['Noah Bennett', 'd-floor', 'p-server'],
  ['Priya Patel', 'd-floor', 'p-cashier'],
  ['Zoe Martin', 'd-floor', 'p-host'],
  ['Marcus Johnson', 'd-kitchen', 'p-chef'],
  ['Sofia Rossi', 'd-kitchen', 'p-line'],
  ['Kenji Tanaka', 'd-kitchen', 'p-line'],
  ['Amara Okafor', 'd-kitchen', 'p-prep'],
  ['Lucas Meyer', 'd-bar', 'p-bartender'],
  ['Chloé Dubois', 'd-bar', 'p-bartender'],
  ['Ravi Sharma', 'd-bar', 'p-barback'],
  ['Isabella Cruz', 'd-sales', 'p-keyholder'],
  ['Ethan Brooks', 'd-sales', 'p-sales'],
  ['Hana Kim', 'd-sales', 'p-sales'],
  ['Olivia Grant', 'd-sales', 'p-sales'],
  ['Tariq Aziz', 'd-support', 'p-stock'],
  ['Grace Liu', 'd-support', 'p-cleaner'],
  ['Ben Carter', 'd-support', 'p-stock'],
]

const BIOS = [
  'Runs a calm floor and loves a busy Saturday brunch.',
  'Turns first-time guests into regulars.',
  'Latte art that belongs in a gallery.',
  'Never met a rush they couldn’t clear.',
  'The person you want next to you on a closing shift.',
  'Quietly keeps the whole team organised.',
  'Weekend warrior and coffee obsessive.',
  'Always the first to raise their hand for cover.',
]

function pick<T>(arr: T[], seed: string, count: number): T[] {
  const scored = arr
    .map((v, i) => ({ v, s: seededRandom(`${seed}-${i}`) }))
    .sort((a, b) => a.s - b.s)
  return scored.slice(0, count).map((x) => x.v)
}

export const EMPLOYEES: Employee[] = ROSTER.map((seed, i): Employee => {
  const [name, departmentId, positionId, role = 'employee'] = seed
  const firstName = name.split(' ')[0]
  const id = `e${i + 1}`
  const r = (k: string) => seededRandom(`${id}-${k}`)
  const homeLocationId = LOCATIONS[Math.floor(r('loc') * LOCATIONS.length)].id
  const skills = pick(SKILLS, `${id}-sk`, 3 + Math.floor(r('nsk') * 3))
  const certs = pick(CERTS, `${id}-ce`, 1 + Math.floor(r('nce') * 2))
  const badges = pick(BADGES.map((b) => b.id), `${id}-bd`, 2 + Math.floor(r('nbd') * 3))
  const imgIndex = ((i * 3 + 7) % 70) + 1

  const windows: Record<number, [number, number] | null> = {}
  for (let d = 0; d < 7; d++) {
    const off = r(`day-${d}`) < 0.18
    windows[d] = off ? null : [360 + Math.floor(r(`ws-${d}`) * 180), 1200 + Math.floor(r(`we-${d}`) * 240)]
  }

  return {
    id,
    name,
    firstName,
    avatar: avatarUrl(imgIndex),
    imgIndex,
    role,
    positionId,
    departmentId,
    homeLocationId,
    email: `${firstName.toLowerCase()}@cadence.work`,
    phone: `+1 (415) 555-0${(100 + i).toString().slice(-3)}`,
    skills,
    certifications: certs,
    badges,
    status: 'scheduled',
    punctuality: Math.round(82 + r('punc') * 18),
    streak: Math.floor(r('streak') * 24),
    hoursThisWeek: Math.round((22 + r('hrs') * 18) * 10) / 10,
    rating: Math.round((4.2 + r('rate') * 0.8) * 10) / 10,
    startedAt: format(addDays(new Date(2021, 0, 1), Math.floor(r('start') * 1500)), 'yyyy-MM-dd'),
    birthday: format(addDays(new Date(1990, 0, 1), Math.floor(r('bd') * 4000)), 'yyyy-MM-dd'),
    bio: BIOS[i % BIOS.length],
    availability: {
      preferred: [20, 24, 30, 32, 38, 40][Math.floor(r('pref') * 6)],
      min: 12,
      max: 40,
      windows,
      unavailableDates: [],
      vacationMode: false,
      preferredLocationIds: [homeLocationId],
    },
  }
})

export const CURRENT_USER_ID = 'e1'

/* ------------------------------------------------------------------ *
 *  Shift generation across a two-week window
 * ------------------------------------------------------------------ */

const WEEK_START = startOfWeek(new Date(), { weekStartsOn: 1 })
export const RANGE_START = addDays(WEEK_START, -3)
const RANGE_DAYS = 21

const TEMPLATES: Record<string, { start: number; end: number; label: string }> = {
  open: { start: 360, end: 840, label: 'Opening' },
  mid: { start: 540, end: 1020, label: 'Mid' },
  mid2: { start: 660, end: 1140, label: 'Mid' },
  close: { start: 840, end: 1320, label: 'Close' },
  night: { start: 1320, end: 1740, label: 'Night' },
  shortPm: { start: 1020, end: 1260, label: 'Evening' },
}
const TEMPLATE_KEYS = Object.keys(TEMPLATES)

const employeesByDept = (deptId: string) => EMPLOYEES.filter((e) => e.departmentId === deptId)
const positionsByDept = (deptId: string) => POSITIONS.filter((p) => p.departmentId === deptId)

function isoDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

const shifts: Shift[] = []
let shiftSeq = 0

for (let day = 0; day < RANGE_DAYS; day++) {
  const date = addDays(RANGE_START, day)
  const dateStr = isoDate(date)
  const dow = date.getDay()
  const weekend = dow === 0 || dow === 6

  for (const loc of LOCATIONS) {
    const load = weekend ? 1.25 : 1
    for (const dept of DEPARTMENTS) {
      if (dept.key === 'management') continue
      const depPositions = positionsByDept(dept.id)
      const depEmployees = employeesByDept(dept.id)
      if (depPositions.length === 0) continue

      const baseCount = dept.key === 'floor' ? 3 : dept.key === 'kitchen' ? 2 : 1
      const count = Math.max(1, Math.round(baseCount * load))

      for (let n = 0; n < count; n++) {
        shiftSeq++
        const sid = `s${shiftSeq}`
        const r = (k: string) => seededRandom(`${sid}-${k}-${dateStr}-${loc.id}`)
        const tplKey = TEMPLATE_KEYS[Math.floor(r('tpl') * (dept.key === 'bar' ? TEMPLATE_KEYS.length : 4))]
        const tpl = TEMPLATES[tplKey]
        const pos = depPositions[Math.floor(r('pos') * depPositions.length)]

        // Decide assignment: keep ~18% of upcoming shifts open for the marketplace.
        const future = day >= 3
        const openChance = future ? 0.2 : 0
        const isOpen = r('open') < openChance
        let employeeId: string | null = null
        if (!isOpen && depEmployees.length) {
          const cand = depEmployees[Math.floor(r('emp') * depEmployees.length)]
          employeeId = cand.id
        }

        const distanceMi = Math.round((1 + r('dist') * 12) * 10) / 10
        shifts.push({
          id: sid,
          date: dateStr,
          start: tpl.start,
          end: tpl.end,
          employeeId,
          positionId: pos.id,
          departmentId: dept.id,
          locationId: loc.id,
          status: isOpen ? 'open' : day < 3 ? 'confirmed' : 'published',
          requiredSkills: pick(SKILLS, `${sid}-rs`, 1 + Math.floor(r('nrs') * 2)),
          distanceMi,
          breakMin: tpl.end - tpl.start > 300 ? 30 : 0,
          note: r('note') < 0.12 ? 'Expecting a delivery mid-shift.' : undefined,
        })
      }
    }
  }

  // A couple of management/lead shifts at the flagship so the current user has a roster.
  if (dow !== 0) {
    shiftSeq++
    const leadTpl = dow % 2 === 0 ? TEMPLATES.open : TEMPLATES.close
    shifts.push({
      id: `s${shiftSeq}`,
      date: dateStr,
      start: leadTpl.start,
      end: leadTpl.end,
      employeeId: CURRENT_USER_ID,
      positionId: 'p-lead',
      departmentId: 'd-mgmt',
      locationId: 'l-flagship',
      status: day < 3 ? 'confirmed' : 'published',
      requiredSkills: ['Opening', 'Closing'],
      breakMin: 30,
    })
  }
}

export const SHIFTS: Shift[] = shifts

/* ------------------------------------------------------------------ *
 *  Requests, notifications, social
 * ------------------------------------------------------------------ */

const now = new Date()
const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()
const ahead = (d: number) => isoDate(addDays(now, d))

const openShifts = SHIFTS.filter((s) => s.status === 'open')

export const SWAP_REQUESTS: SwapRequest[] = [
  {
    id: 'sw1',
    shiftId: SHIFTS.find((s) => s.employeeId === 'e4')?.id ?? SHIFTS[0].id,
    fromEmployeeId: 'e4',
    toEmployeeId: 'e6',
    kind: 'swap',
    status: 'pending',
    createdAt: ago(3),
    message: 'Any chance you can take my Friday close? I’ll owe you one ☕',
  },
  {
    id: 'sw2',
    shiftId: SHIFTS.find((s) => s.employeeId === 'e13')?.id ?? SHIFTS[1].id,
    fromEmployeeId: 'e13',
    toEmployeeId: null,
    kind: 'offer-all',
    status: 'pending',
    createdAt: ago(9),
    message: 'Offering my Saturday prep shift — first come first served.',
  },
  {
    id: 'sw3',
    shiftId: SHIFTS.find((s) => s.employeeId === 'e16')?.id ?? SHIFTS[2].id,
    fromEmployeeId: 'e16',
    toEmployeeId: 'e17',
    kind: 'swap',
    status: 'approved',
    createdAt: ago(28),
  },
]

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'lr1', employeeId: 'e5', type: 'annual', start: ahead(12), end: ahead(19), status: 'pending', reason: 'Family trip to Oregon.', createdAt: ago(20), days: 6 },
  { id: 'lr2', employeeId: 'e9', type: 'sick', start: ahead(1), end: ahead(1), status: 'pending', reason: 'Doctor’s appointment.', createdAt: ago(5), days: 1 },
  { id: 'lr3', employeeId: 'e12', type: 'study', start: ahead(4), end: ahead(5), status: 'pending', reason: 'Exams.', createdAt: ago(30), days: 2 },
  { id: 'lr4', employeeId: 'e20', type: 'personal', start: ahead(-2), end: ahead(-2), status: 'approved', reason: 'Moving apartments.', createdAt: ago(72), days: 1 },
  { id: 'lr5', employeeId: 'e7', type: 'annual', start: ahead(25), end: ahead(32), status: 'approved', reason: 'Vacation.', createdAt: ago(120), days: 6 },
]

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', kind: 'swap', title: 'Swap request from Aisha', body: 'Aisha Khan wants to swap her Friday close with you.', createdAt: ago(3), read: false, actorId: 'e4' },
  { id: 'n2', kind: 'shift-picked', title: 'Open shift claimed', body: 'Emma Wilson picked up the Sunday opening at Marina Café.', createdAt: ago(6), read: false, actorId: 'e6' },
  { id: 'n3', kind: 'roster', title: 'Next week’s roster is live', body: 'The schedule for next week has been published.', createdAt: ago(14), read: false },
  { id: 'n4', kind: 'leave', title: 'Leave approved', body: 'Your personal leave for next Thursday was approved.', createdAt: ago(22), read: true },
  { id: 'n5', kind: 'announcement', title: 'New espresso menu launch', body: 'Nadia posted an announcement to Flagship.', createdAt: ago(30), read: true, actorId: 'e2' },
  { id: 'n6', kind: 'badge', title: 'You earned a badge!', body: '“On Fire” — 20-shift punctuality streak. Keep it going 🔥', createdAt: ago(46), read: true },
  { id: 'n7', kind: 'reminder', title: 'Shift in 12 hours', body: 'Opening shift tomorrow at Downtown Flagship, 6:00 AM.', createdAt: ago(1), read: false },
]

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', authorId: 'e2', title: 'New espresso menu launches Monday', body: 'Team — the new single-origin espresso menu goes live Monday. Tasting session Sunday 3pm at the Flagship. Please review the recipe cards before your next shift.', createdAt: ago(30), pinned: true, audience: 'All locations' },
  { id: 'a2', authorId: 'e1', title: 'Holiday roster — pick your preferences', body: 'The holiday scheduling window is open. Add your availability and time-off preferences by Friday and I’ll do my best to accommodate everyone.', createdAt: ago(52), pinned: false, audience: 'Flagship · Marina' },
  { id: 'a3', authorId: 'e3', title: 'Payroll cutoff moved to Wednesday', body: 'Heads up: this pay period’s cutoff is Wednesday 5pm. Make sure all clock-ins are corrected before then.', createdAt: ago(96), pinned: false, audience: 'All locations' },
]

export const RECOGNITION: Recognition[] = [
  { id: 'r1', fromId: 'e2', toId: 'e6', message: 'Emma jumped on three open shifts this week and saved our weekend. Absolute legend. 🙌', createdAt: ago(8), reactions: 14 },
  { id: 'r2', fromId: 'e1', toId: 'e12', message: 'Marcus trained two new line cooks and kept the pass spotless during Saturday’s rush.', createdAt: ago(26), reactions: 9 },
  { id: 'r3', fromId: 'e19', toId: 'e10', message: 'Zoe’s energy at the host stand is unmatched — guests keep asking for her by name.', createdAt: ago(50), reactions: 21 },
]

function threadMessages(ids: string[], seedKey: string, lines: [string, string][]): ChatThread['messages'] {
  return lines.map(([sender, body], i) => ({
    id: `${seedKey}-m${i}`,
    senderId: sender,
    body,
    createdAt: ago(lines.length - i + Math.floor(seededRandom(`${seedKey}-${i}`) * 3)),
  }))
}

export const CHAT_THREADS: ChatThread[] = [
  {
    id: 't1',
    kind: 'direct',
    name: 'Maya Chen',
    participantIds: ['e1', 'e4'],
    unread: 2,
    messages: threadMessages(['e1', 'e4'], 't1', [
      ['e4', 'Hey! Are you on the floor tomorrow morning?'],
      ['e1', 'Yep, opening at 6. Why’s up?'],
      ['e4', 'Could you save me a couple of the new pastries? 🥐'],
      ['e4', 'Also — is the espresso machine fixed?'],
    ]),
  },
  {
    id: 't2',
    kind: 'store',
    name: 'Downtown Flagship',
    participantIds: ['e1', 'e2', 'e4', 'e5', 'e6', 'e12'],
    unread: 0,
    messages: threadMessages(['e1', 'e2'], 't2', [
      ['e2', 'Great work today everyone — record Saturday covers! 🎉'],
      ['e6', 'Team effort 💪'],
      ['e12', 'Kitchen held it down 🔥'],
      ['e1', 'Proud of this crew. Drinks on me next week.'],
    ]),
  },
  {
    id: 't3',
    kind: 'department',
    name: 'Kitchen',
    participantIds: ['e12', 'e13', 'e14', 'e15'],
    unread: 1,
    messages: threadMessages(['e12', 'e13'], 't3', [
      ['e13', 'We’re low on the truffle oil for the special.'],
      ['e12', 'Ordering now — should land Thursday.'],
      ['e15', 'Prep list for tomorrow is on the board.'],
    ]),
  },
  {
    id: 't4',
    kind: 'shift',
    name: 'Fri · Marina Close',
    participantIds: ['e1', 'e6', 'e7'],
    unread: 0,
    messages: threadMessages(['e6', 'e7'], 't4', [
      ['e6', 'Who’s locking up tonight?'],
      ['e7', 'I’ve got it — see you at handover.'],
    ]),
  },
]

/* ------------------------------------------------------------------ *
 *  Convenience exports
 * ------------------------------------------------------------------ */

export const OPEN_SHIFT_COUNT = openShifts.length
export const TODAY_ISO = isoDate(now)
