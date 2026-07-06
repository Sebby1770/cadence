import { useState } from 'react'
import { Users, Building2, Boxes, DollarSign, Settings, Shield, Plus, Pencil, MapPin, ScrollText } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DEPARTMENTS, EMPLOYEES, LOCATIONS, POSITIONS } from '@/data/mock'
import type { Employee, Role } from '@/data/types'
import { departmentName, laborCost, locationName, positionName } from '@/data/selectors'
import { cn, currency, relativeTime } from '@/lib/utils'
import { Avatar, Badge, Button, Card, DeptDot, Modal, Segmented } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

type Tab = 'users' | 'places' | 'structure' | 'rates' | 'settings'

const AUDIT = [
  { who: 'e1', what: 'published the roster for next week', h: 2 },
  { who: 'e2', what: 'approved a swap between Aisha and Emma', h: 6 },
  { who: 'e3', what: 'updated pay rate for Bartender to $21.00', h: 26 },
  { who: 'e1', what: 'created 4 open shifts at Marina Café', h: 30 },
  { who: 'e2', what: 'approved annual leave for Olivia Grant', h: 52 },
]

export default function Admin() {
  const addToast = useStore((s) => s.addToast)
  const shifts = useStore((s) => s.shifts)
  const [tab, setTab] = useState<Tab>('users')
  const [edit, setEdit] = useState<Employee | null>(null)
  const [rates, setRates] = useState<Record<string, number>>(() => Object.fromEntries(POSITIONS.map((p) => [p.id, p.rate])))
  const [settings, setSettings] = useState({ overtime: 38, rest: 10, gps: true, autoSwap: true })

  const weekCost = laborCost(shifts.filter((s) => s.employeeId).slice(0, 200))

  return (
    <PageShell>
      <PageHeader
        title="Admin"
        subtitle="Manage people, places, and company settings."
        actions={<span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[13px] font-medium text-primary"><Shield className="h-4 w-4" /> Admin access</span>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Employees" value={String(EMPLOYEES.length)} />
        <Summary label="Locations" value={String(LOCATIONS.length)} />
        <Summary label="Departments" value={String(DEPARTMENTS.length)} />
        <Summary label="Weekly labour" value={currency(weekCost)} />
      </div>

      <Segmented
        options={[
          { value: 'users', label: 'Users' },
          { value: 'places', label: 'Workplaces' },
          { value: 'structure', label: 'Structure' },
          { value: 'rates', label: 'Pay rates' },
          { value: 'settings', label: 'Settings' },
        ]}
        value={tab}
        onChange={setTab}
        layoutId="admin-tab"
      />

      {tab === 'users' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="inline-flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> {EMPLOYEES.length} users</h3>
            <Button size="sm" onClick={() => addToast({ title: 'Invite sent', kind: 'success' })}><Plus className="h-3.5 w-3.5" /> Invite</Button>
          </div>
          <div className="divide-y divide-border">
            {EMPLOYEES.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 p-3">
                <Avatar src={e.avatar} name={e.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.email}</p>
                </div>
                <Badge tone={e.role === 'admin' ? 'danger' : e.role === 'manager' ? 'primary' : 'neutral'} className="capitalize">{e.role}</Badge>
                <span className="hidden text-xs text-muted-foreground sm:inline">{departmentName(e.departmentId)}</span>
                <span className="hidden text-xs text-muted-foreground md:inline">{locationName(e.homeLocationId)}</span>
                <Button size="sm" variant="ghost" onClick={() => setEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'places' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOCATIONS.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {l.address}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => addToast({ title: `Editing ${l.short}`, kind: 'info' })}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-secondary px-2 py-1">{l.region}</span>
                <span className="rounded-md bg-secondary px-2 py-1">Target {l.headcountTarget}</span>
              </div>
            </Card>
          ))}
          <button onClick={() => addToast({ title: 'New workplace', kind: 'info' })} className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-secondary/40">
            <Plus className="mr-1.5 h-4 w-4" /> Add workplace
          </button>
        </div>
      )}

      {tab === 'structure' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {DEPARTMENTS.map((d) => (
            <Card key={d.id} className="p-4">
              <p className="inline-flex items-center gap-2 font-semibold"><DeptDot dept={d.key} /> {d.name}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {POSITIONS.filter((p) => p.departmentId === d.id).map((p) => (
                  <span key={p.id} className="rounded-lg bg-secondary px-2.5 py-1 text-[13px] font-medium">{p.name}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'rates' && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 font-semibold"><DollarSign className="h-4 w-4" /> Pay rates</h3>
            <Button size="sm" onClick={() => addToast({ title: 'Pay rates saved', kind: 'success' })}>Save changes</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {POSITIONS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{departmentName(p.departmentId)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.5"
                    value={rates[p.id]}
                    onChange={(e) => setRates((r) => ({ ...r, [p.id]: +e.target.value }))}
                    className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular outline-none focus-ring"
                  />
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 inline-flex items-center gap-2 font-semibold"><Settings className="h-4 w-4" /> Scheduling rules</h3>
            <NumberRow label="Overtime threshold (hrs/week)" value={settings.overtime} onChange={(v) => setSettings((s) => ({ ...s, overtime: v }))} />
            <NumberRow label="Minimum rest between shifts (hrs)" value={settings.rest} onChange={(v) => setSettings((s) => ({ ...s, rest: v }))} />
            <ToggleRow label="Require GPS at clock-in" on={settings.gps} onClick={() => setSettings((s) => ({ ...s, gps: !s.gps }))} />
            <ToggleRow label="Auto-approve swaps within rules" on={settings.autoSwap} onClick={() => setSettings((s) => ({ ...s, autoSwap: !s.autoSwap }))} />
            <Button className="mt-4 w-full" onClick={() => addToast({ title: 'Settings saved', kind: 'success' })}>Save settings</Button>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 inline-flex items-center gap-2 font-semibold"><ScrollText className="h-4 w-4" /> Audit log</h3>
            <div className="space-y-2.5">
              {AUDIT.map((a, i) => {
                const who = EMPLOYEES.find((e) => e.id === a.who)
                return (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    {who && <Avatar src={who.avatar} name={who.name} size="xs" />}
                    <p className="flex-1 text-muted-foreground"><strong className="text-foreground">{who?.firstName}</strong> {a.what}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground/70">{relativeTime(new Date(Date.now() - a.h * 3600_000))}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      <EditUserModal employee={edit} onClose={() => setEdit(null)} onSave={() => { addToast({ title: 'User updated', kind: 'success' }); setEdit(null) }} />
    </PageShell>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-2xl font-bold tabular">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  )
}

function NumberRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(+e.target.value)} className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular outline-none focus-ring" />
    </div>
  )
}

function ToggleRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button onClick={onClick} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-secondary')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-5' : 'left-0.5')} />
      </button>
    </div>
  )
}

function EditUserModal({ employee, onClose, onSave }: { employee: Employee | null; onClose: () => void; onSave: () => void }) {
  const [role, setRole] = useState<Role>('employee')
  if (!employee) return null
  return (
    <Modal open={!!employee} onClose={onClose} title={`Edit ${employee.name}`} description={positionName(employee.positionId)}>
      <div className="space-y-4 p-5">
        <Field label="Full name"><input defaultValue={employee.name} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring" /></Field>
        <Field label="Email"><input defaultValue={employee.email} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus-ring" /></Field>
        <Field label="Role">
          <div className="flex gap-2">
            {(['employee', 'manager', 'admin'] as Role[]).map((r) => (
              <button key={r} onClick={() => setRole(r)} className={cn('flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors', (role === r) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary/60')}>{r}</button>
            ))}
          </div>
        </Field>
        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={onSave}>Save</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
