import { describe, expect, it } from 'vitest'
import type { Employee, Location, Shift } from '@/data/types'
import {
  buildIcs,
  coverageGaps,
  findDoubleBooks,
  hoursFairness,
  overtimeFlags,
  shiftsOverlap,
} from '@/lib/staffing'

function employee(partial: Partial<Employee> & Pick<Employee, 'id' | 'name'>): Employee {
  const { availability, ...rest } = partial
  return {
    firstName: partial.name.split(' ')[0] ?? 'Pat',
    avatar: '',
    imgIndex: 1,
    role: 'employee',
    positionId: 'p-barista',
    departmentId: 'd-floor',
    homeLocationId: 'l-flagship',
    email: 'pat@cadence.work',
    phone: '',
    skills: [],
    certifications: [],
    badges: [],
    status: 'scheduled',
    punctuality: 100,
    streak: 0,
    hoursThisWeek: 0,
    rating: 5,
    startedAt: '2024-01-01',
    birthday: '1990-01-01',
    bio: '',
    ...rest,
    availability: {
      preferred: 30,
      min: 12,
      max: 40,
      windows: {},
      unavailableDates: [],
      vacationMode: false,
      preferredLocationIds: [],
      ...availability,
    },
  }
}

function location(partial: Partial<Location> & Pick<Location, 'id' | 'name' | 'headcountTarget'>): Location {
  return {
    short: partial.name.slice(0, 4),
    address: '1 Main',
    region: 'Downtown',
    map: { x: 50, y: 50 },
    color: '245 68% 60%',
    ...partial,
  }
}

function shift(partial: Partial<Shift> & Pick<Shift, 'id' | 'date' | 'start' | 'end'>): Shift {
  return {
    employeeId: 'e1',
    positionId: 'p-barista',
    departmentId: 'd-floor',
    locationId: 'l-flagship',
    status: 'published',
    requiredSkills: [],
    ...partial,
  }
}

const maya = employee({ id: 'e-maya', name: 'Maya Chen' })
const liam = employee({ id: 'e-liam', name: 'Liam Novak' })

describe('shiftsOverlap', () => {
  it('detects overlapping shifts for the same employee on the same date', () => {
    const a = shift({ id: 's1', date: '2026-08-18', start: 540, end: 900, employeeId: maya.id })
    const b = shift({ id: 's2', date: '2026-08-18', start: 840, end: 1140, employeeId: maya.id })
    expect(shiftsOverlap(a, b)).toBe(true)
    expect(findDoubleBooks([a, b])).toHaveLength(1)
  })

  it('does not treat adjacent end-exclusive shifts as overlapping', () => {
    const morning = shift({ id: 's1', date: '2026-08-18', start: 360, end: 840, employeeId: maya.id })
    const afternoon = shift({ id: 's2', date: '2026-08-18', start: 840, end: 1320, employeeId: maya.id })
    expect(shiftsOverlap(morning, afternoon)).toBe(false)
    expect(findDoubleBooks([morning, afternoon])).toHaveLength(0)
  })
})

describe('overtimeFlags', () => {
  it('flags weekly hours above availability.max', () => {
    const capped = employee({
      id: 'e-ot',
      name: 'Over Timer',
      availability: {
        preferred: 20,
        min: 10,
        max: 8,
        windows: {},
        unavailableDates: [],
        vacationMode: false,
        preferredLocationIds: [],
      },
    })
    const long = shift({
      id: 's-ot',
      date: '2026-08-17',
      start: 360,
      end: 1020,
      breakMin: 30,
      employeeId: capped.id,
    })
    const flags = overtimeFlags([long], [capped], ['2026-08-17', '2026-08-18'])
    expect(flags).toHaveLength(1)
    expect(flags[0].employee.id).toBe(capped.id)
    expect(flags[0].hours).toBeGreaterThan(capped.availability.max)
  })
})

describe('coverageGaps', () => {
  it('reports a location when assigned count is below headcountTarget', () => {
    const flagship = location({ id: 'l-flagship', name: 'Downtown Flagship', headcountTarget: 3 })
    const marina = location({ id: 'l-marina', name: 'Marina Café', headcountTarget: 1 })
    const assigned = [
      shift({ id: 's1', date: '2026-08-18', start: 540, end: 900, employeeId: maya.id, locationId: flagship.id }),
      shift({ id: 's2', date: '2026-08-18', start: 540, end: 900, employeeId: liam.id, locationId: marina.id }),
    ]
    const gaps = coverageGaps(assigned, [flagship, marina], '2026-08-18')
    expect(gaps).toHaveLength(1)
    expect(gaps[0].location.id).toBe(flagship.id)
    expect(gaps[0].assigned).toBe(1)
    expect(gaps[0].shortfall).toBe(2)
  })
})

describe('hoursFairness', () => {
  it('computes mean and stdev among people with at least one shift', () => {
    const idle = employee({ id: 'e-idle', name: 'Idle Person' })
    const shifts = [
      shift({ id: 's1', date: '2026-08-17', start: 0, end: 120, employeeId: maya.id }),
      shift({ id: 's2', date: '2026-08-17', start: 0, end: 360, employeeId: liam.id }),
    ]
    const fairness = hoursFairness(shifts, [maya, liam, idle], ['2026-08-17'])
    expect(fairness.count).toBe(2)
    expect(fairness.mean).toBe(4)
    expect(fairness.stdev).toBeCloseTo(2, 5)
  })
})

describe('buildIcs', () => {
  it('emits a VCALENDAR that includes the employee name', () => {
    const upcoming = shift({
      id: 's-ics',
      date: '2026-08-20',
      start: 540,
      end: 1020,
      employeeId: maya.id,
      status: 'published',
    })
    const ics = buildIcs([upcoming], maya, new Date(2026, 7, 18, 8, 0, 0))
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('Maya Chen')
    expect(ics).toContain('\r\n')
    expect(ics).toContain('DTSTART:')
    expect(ics).toContain('DTEND:')
    expect(ics).toContain('SUMMARY:')
  })
})
