import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Star, Mail, Phone, MessageSquare, Send, MapPin } from 'lucide-react'
import { badgeIcon } from '@/components/shared/badgeIcon'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { BADGES, DEPARTMENTS, EMPLOYEES, LOCATIONS } from '@/data/mock'
import type { Employee } from '@/data/types'
import {
  departmentKey,
  departmentName,
  locationName,
  positionName,
  upcomingShifts,
} from '@/data/selectors'
import { cn, formatHours } from '@/lib/utils'
import { Avatar, Badge, Button, Card, DeptDot, EmptyState, Modal, Ring } from '@/components/ui'
import { ShiftListItem } from '@/components/shared/ShiftBits'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

export default function Team() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState<'all' | string>('all')
  const [loc, setLoc] = useState<'all' | string>('all')
  const [focus, setFocus] = useState<Employee | null>(null)

  useEffect(() => {
    const id = params.get('focus')
    if (id) {
      const e = EMPLOYEES.find((x) => x.id === id)
      if (e) setFocus(e)
    }
  }, [params])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return EMPLOYEES.filter(
      (e) =>
        (dept === 'all' || e.departmentId === dept) &&
        (loc === 'all' || e.homeLocationId === loc) &&
        (!ql || e.name.toLowerCase().includes(ql) || e.skills.some((s) => s.toLowerCase().includes(ql)) || positionName(e.positionId).toLowerCase().includes(ql)),
    )
  }, [q, dept, loc])

  return (
    <PageShell>
      <PageHeader title="Team Directory" subtitle={`${EMPLOYEES.length} teammates across ${LOCATIONS.length} locations`} />

      <Card className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-secondary/60 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, role, or skill…" className="h-full flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring">
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={loc} onChange={(e) => setLoc(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring">
          <option value="all">All locations</option>
          {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.short}</option>)}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No teammates found" description="Try a different search or filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e, i) => (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              onClick={() => setFocus(e)}
              className="h-full text-left"
            >
              <Card hover className="h-full p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={e.avatar} name={e.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{positionName(e.positionId)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <DeptDot dept={departmentKey(e.departmentId)} /> {departmentName(e.departmentId)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {e.rating.toFixed(1)}
                  </span>
                </div>
                {/* Single clipped row so every card in a grid row is the same height */}
                <div className="mt-3 flex h-[22px] flex-nowrap items-center gap-1 overflow-hidden">
                  {e.skills.slice(0, 3).map((s) => (
                    <span key={s} className="whitespace-nowrap rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
                  ))}
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      )}

      <ProfileModal employee={focus} onClose={() => { setFocus(null); if (params.get('focus')) setParams({}) }} />
    </PageShell>
  )
}

function ProfileModal({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  const now = useNow(60_000)
  const navigate = useNavigate()
  const shifts = useStore((s) => s.shifts)
  const addToast = useStore((s) => s.addToast)
  if (!employee) return null
  const e = employee
  const upcoming = upcomingShifts(shifts, e.id, now, 4)
  const earned = BADGES.filter((b) => e.badges.includes(b.id))

  return (
    <Modal open={!!employee} onClose={onClose} className="sm:max-w-xl">
      <div>
        <div className="relative h-24 bg-gradient-to-br from-primary/30 via-purple-500/20 to-dept-floor/20">
          <div className="absolute -bottom-8 left-5">
            <Avatar src={e.avatar} name={e.name} size="2xl" className="ring-4 ring-card" />
          </div>
        </div>
        <div className="px-5 pb-5 pt-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{e.name}</h2>
              <p className="text-sm text-muted-foreground">{positionName(e.positionId)} · {locationName(e.homeLocationId)}</p>
            </div>
            <Ring value={e.punctuality} size={56} label={`${e.punctuality}%`} sublabel="on time" tone="hsl(var(--success))" />
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => { onClose(); navigate('/messages') }}><MessageSquare className="h-4 w-4" /> Message</Button>
            <Button variant="outline" className="flex-1" onClick={() => addToast({ title: `Shift offered to ${e.firstName}`, kind: 'success' })}><Send className="h-4 w-4" /> Offer shift</Button>
          </div>

          <Section title="Contact">
            <div className="flex flex-col gap-1.5 text-sm">
              <a href={`mailto:${e.email}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4" /> {e.email}</a>
              <span className="inline-flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {e.phone}</span>
              <span className="inline-flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {locationName(e.homeLocationId)}</span>
            </div>
          </Section>

          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">{e.skills.map((s) => <Badge key={s} tone="primary">{s}</Badge>)}</div>
          </Section>

          <Section title="Certifications">
            <div className="flex flex-wrap gap-1.5">{e.certifications.map((c) => <Badge key={c} tone="success">{c}</Badge>)}</div>
          </Section>

          <Section title="Availability">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Prefers <strong className="text-foreground">{formatHours(e.availability.preferred)}</strong>/wk</span>
              <span>Min <strong className="text-foreground">{e.availability.min}h</strong></span>
              <span>Max <strong className="text-foreground">{e.availability.max}h</strong></span>
            </div>
          </Section>

          {earned.length > 0 && (
            <Section title="Badges">
              <div className="flex flex-wrap gap-2">
                {earned.map((b) => {
                  const Icon = badgeIcon(b.icon)
                  return (
                    <span key={b.id} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium" style={{ background: `hsl(${b.color} / 0.12)`, color: `hsl(${b.color})` }}>
                      <Icon className="h-3.5 w-3.5" /> {b.name}
                    </span>
                  )
                })}
              </div>
            </Section>
          )}

          {upcoming.length > 0 && (
            <Section title="Upcoming shifts">
              <div className="space-y-2">{upcoming.map((s) => <ShiftListItem key={s.id} shift={s} />)}</div>
            </Section>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className={cn('mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground')}>{title}</p>
      {children}
    </div>
  )
}
