import { addDays, format } from 'date-fns'
import { avatarUrl } from '@/lib/utils'
import type { Company, Department, Employee, Location, Position, ReferenceData, Shift } from './types'

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

const SAMPLE_NAMES = ['Jordan Lee', 'Sam Rivera', 'Casey Kim', 'Alex Morgan', 'Riley Chen', 'Taylor Brooks']
const SKILLS = ['POS', 'Customer Service', 'Opening', 'Closing', 'Food Safety', 'Cash Handling']

function defaultWindows(): Record<number, [number, number] | null> {
  const w: Record<number, [number, number] | null> = {}
  for (let d = 0; d < 7; d++) w[d] = d === 0 ? null : [480, 1320]
  return w
}

function makeEmployee(
  cid: string,
  i: number,
  name: string,
  role: Employee['role'],
  positionId: string,
  departmentId: string,
  homeLocationId: string,
): Employee {
  const first = name.split(' ')[0]
  const imgIndex = ((i * 7 + 5) % 70) + 1
  return {
    id: `${cid}-e${i}`,
    name,
    firstName: first,
    avatar: avatarUrl(imgIndex),
    imgIndex,
    role,
    positionId,
    departmentId,
    homeLocationId,
    email: `${first.toLowerCase()}@example.com`,
    phone: '+1 (555) 000-00' + (10 + i),
    skills: SKILLS.slice(i % 3, (i % 3) + 3),
    certifications: ['Food Handler'],
    badges: ['b-punctual', 'b-helper'].slice(0, (i % 2) + 1),
    status: 'scheduled',
    punctuality: 90 + (i % 8),
    streak: (i * 3) % 12,
    hoursThisWeek: 0,
    rating: 4.4 + ((i % 5) / 10),
    startedAt: '2024-01-15',
    birthday: '1996-05-20',
    bio: 'A valued member of the team.',
    availability: {
      preferred: 30,
      min: 12,
      max: 40,
      windows: defaultWindows(),
      unavailableDates: [],
      vacationMode: false,
      preferredLocationIds: [homeLocationId],
    },
  }
}

export interface Starter {
  company: Company
  reference: ReferenceData
  shifts: Shift[]
}

/** Build a ready-to-use starter org for a brand-new company. */
export function buildStarter(
  cid: string,
  companyName: string,
  slug: string,
  joinCode: string,
  accent: string,
  ownerName: string,
  now: Date,
): Starter {
  const dFloor: Department = { id: `${cid}-d-floor`, name: 'Floor', key: 'floor' }
  const dKitchen: Department = { id: `${cid}-d-kitchen`, name: 'Kitchen', key: 'kitchen' }
  const dMgmt: Department = { id: `${cid}-d-mgmt`, name: 'Management', key: 'management' }
  const departments = [dFloor, dKitchen, dMgmt]

  const pBarista: Position = { id: `${cid}-p-barista`, name: 'Barista', departmentId: dFloor.id, rate: 19 }
  const pServer: Position = { id: `${cid}-p-server`, name: 'Server', departmentId: dFloor.id, rate: 18 }
  const pCook: Position = { id: `${cid}-p-cook`, name: 'Cook', departmentId: dKitchen.id, rate: 22 }
  const pLead: Position = { id: `${cid}-p-lead`, name: 'Shift Lead', departmentId: dMgmt.id, rate: 28 }
  const pManager: Position = { id: `${cid}-p-manager`, name: 'Manager', departmentId: dMgmt.id, rate: 36 }
  const positions = [pBarista, pServer, pCook, pLead, pManager]

  const hq: Location = {
    id: `${cid}-l-hq`,
    name: `${companyName} · Main`,
    short: 'Main',
    address: '1 Market Street',
    region: 'HQ',
    map: { x: 50, y: 44 },
    color: accent,
    headcountTarget: 3,
  }
  const locations = [hq]

  const owner = makeEmployee(cid, 1, ownerName, 'manager', pManager.id, dMgmt.id, hq.id)
  const floorPos = [pBarista, pServer]
  const others = SAMPLE_NAMES.map((n, idx) => {
    const kitchen = idx % 3 === 2
    const pos = kitchen ? pCook : floorPos[idx % floorPos.length]
    const deptId = kitchen ? dKitchen.id : dFloor.id
    return makeEmployee(cid, idx + 2, n, 'employee', pos.id, deptId, hq.id)
  })
  const employees = [owner, ...others]

  const company: Company = {
    id: cid,
    name: companyName,
    slug,
    joinCode,
    accent,
    ownerEmployeeId: owner.id,
    createdAt: now.toISOString(),
  }

  // A handful of shifts across the next 6 days so the schedule isn't empty.
  const templates = [
    { start: 480, end: 960, pos: pBarista, dept: dFloor },
    { start: 660, end: 1140, pos: pServer, dept: dFloor },
    { start: 840, end: 1320, pos: pCook, dept: dKitchen },
  ]
  const shifts: Shift[] = []
  let seq = 0
  for (let day = 0; day < 6; day++) {
    const date = iso(addDays(now, day))
    templates.forEach((t, ti) => {
      seq++
      const pick = others[(day + ti) % others.length]
      const open = (day + ti) % 4 === 0 && day >= 1
      shifts.push({
        id: `${cid}-s${seq}`,
        date,
        start: t.start,
        end: t.end,
        employeeId: open ? null : pick.id,
        positionId: t.pos.id,
        departmentId: t.dept.id,
        locationId: hq.id,
        status: open ? 'open' : 'published',
        requiredSkills: SKILLS.slice(0, 2),
        distanceMi: 2 + ti,
        breakMin: 30,
      })
    })
  }

  return { company, reference: { employees, positions, departments, locations, badges: [] }, shifts }
}
