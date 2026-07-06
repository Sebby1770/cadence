import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Repeat2, Users, Send, Search, Check, X, ArrowRight, Inbox } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { EMPLOYEES } from '@/data/mock'
import type { Employee, Shift, SwapRequest } from '@/data/types'
import { getEmployee, locationName, positionName, upcomingShifts } from '@/data/selectors'
import { cn, minutesToLabel, relativeTime } from '@/lib/utils'
import { shortDate } from '@/lib/dates'
import { Avatar, Badge, Button, Card, EmptyState, Modal, Segmented } from '@/components/ui'
import { ShiftListItem } from '@/components/shared/ShiftBits'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

type Tab = 'offer' | 'incoming' | 'outgoing'
type Kind = 'swap' | 'offer-all' | 'offer-selected'

export default function Swaps() {
  const now = useNow(60_000)
  const shifts = useStore((s) => s.shifts)
  const swaps = useStore((s) => s.swaps)
  const role = useStore((s) => s.role)
  const currentUserId = useStore((s) => s.currentUserId)
  const offerShift = useStore((s) => s.offerShift)
  const respondToSwap = useStore((s) => s.respondToSwap)
  const approveSwap = useStore((s) => s.approveSwap)
  const declineSwap = useStore((s) => s.declineSwap)

  const [tab, setTab] = useState<Tab>('offer')
  const [offering, setOffering] = useState<Shift | null>(null)

  const myShifts = upcomingShifts(shifts, currentUserId, now, 12)
  const getShift = (id: string) => shifts.find((s) => s.id === id)

  const incoming = useMemo(
    () =>
      swaps.filter(
        (x) => x.toEmployeeId === currentUserId || (role !== 'employee' && x.kind === 'offer-all') || (role !== 'employee' && x.status === 'pending'),
      ),
    [swaps, currentUserId, role],
  )
  const outgoing = swaps.filter((x) => x.fromEmployeeId === currentUserId)

  return (
    <PageShell>
      <PageHeader
        title="Shift Swaps"
        subtitle="Offer, swap, and cover shifts with your team."
        actions={
          <Segmented
            options={[
              { value: 'offer', label: 'Offer a shift' },
              { value: 'incoming', label: `Incoming${incoming.filter((x) => x.status === 'pending').length ? ` · ${incoming.filter((x) => x.status === 'pending').length}` : ''}` },
              { value: 'outgoing', label: 'Outgoing' },
            ]}
            value={tab}
            onChange={setTab}
            layoutId="swaps-tab"
          />
        }
      />

      {tab === 'offer' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {myShifts.length ? (
            myShifts.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-secondary px-2 py-1 text-[11px] font-semibold">{shortDate(s.date)}</span>
                  <span className="text-xs text-muted-foreground">{minutesToLabel(s.start)}–{minutesToLabel(s.end)}</span>
                </div>
                <ShiftListItem shift={s} showPay />
                <Button className="mt-3 w-full" variant="outline" onClick={() => setOffering(s)}>
                  <Repeat2 className="h-4 w-4" /> Offer or swap this shift
                </Button>
              </Card>
            ))
          ) : (
            <div className="lg:col-span-2">
              <EmptyState icon={Repeat2} title="No upcoming shifts to offer" description="Once you have scheduled shifts, you can offer or swap them here." />
            </div>
          )}
        </div>
      )}

      {tab === 'incoming' && (
        <div className="space-y-3">
          {incoming.length ? (
            incoming.map((x) => (
              <SwapCard
                key={x.id}
                swap={x}
                shift={getShift(x.shiftId)}
                asManager={role !== 'employee' && x.toEmployeeId !== currentUserId}
                onAccept={() => (role !== 'employee' && x.toEmployeeId !== currentUserId ? approveSwap(x.id) : respondToSwap(x.id, true))}
                onDecline={() => (role !== 'employee' && x.toEmployeeId !== currentUserId ? declineSwap(x.id) : respondToSwap(x.id, false))}
              />
            ))
          ) : (
            <EmptyState icon={Inbox} title="Nothing incoming" description="Swap requests sent to you will appear here." />
          )}
        </div>
      )}

      {tab === 'outgoing' && (
        <div className="space-y-3">
          {outgoing.length ? (
            outgoing.map((x) => <SwapCard key={x.id} swap={x} shift={getShift(x.shiftId)} outgoing />)
          ) : (
            <EmptyState icon={Send} title="No outgoing requests" description="Offer one of your shifts to get started." />
          )}
        </div>
      )}

      <OfferModal shift={offering} onClose={() => setOffering(null)} onConfirm={(kind, toId, message) => { if (offering) offerShift(offering.id, kind, toId, message); setOffering(null) }} />
    </PageShell>
  )
}

function statusTone(s: SwapRequest['status']) {
  return s === 'approved' ? 'success' : s === 'declined' ? 'danger' : 'warning'
}

function SwapCard({
  swap,
  shift,
  asManager,
  outgoing,
  onAccept,
  onDecline,
}: {
  swap: SwapRequest
  shift?: Shift
  asManager?: boolean
  outgoing?: boolean
  onAccept?: () => void
  onDecline?: () => void
}) {
  const from = getEmployee(swap.fromEmployeeId)
  const to = getEmployee(swap.toEmployeeId)
  const kindLabel = swap.kind === 'swap' ? 'Direct swap' : swap.kind === 'offer-all' ? 'Offered to all' : 'Offered to selected'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {from && <Avatar src={from.avatar} name={from.name} size="md" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {from?.name}
              {to && <span className="font-normal text-muted-foreground"> <ArrowRight className="inline h-3 w-3" /> {to.firstName}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{kindLabel} · {relativeTime(swap.createdAt)}</p>
          </div>
          <Badge tone={statusTone(swap.status)}>{swap.status}</Badge>
        </div>

        {shift && <div className="mt-3"><ShiftListItem shift={shift} showPay /></div>}
        {swap.message && <p className="mt-3 rounded-xl bg-secondary/40 p-3 text-[13px] text-muted-foreground">“{swap.message}”</p>}

        {!outgoing && swap.status === 'pending' && (
          <div className="mt-3 flex gap-2">
            <Button variant="success" className="flex-1" onClick={onAccept}>
              <Check className="h-4 w-4" /> {asManager ? 'Approve' : 'Accept'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onDecline}>
              <X className="h-4 w-4" /> Decline
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function OfferModal({
  shift,
  onClose,
  onConfirm,
}: {
  shift: Shift | null
  onClose: () => void
  onConfirm: (kind: Kind, toId: string | null, message?: string) => void
}) {
  const [kind, setKind] = useState<Kind>('offer-all')
  const [selected, setSelected] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [message, setMessage] = useState('')

  const coworkers = EMPLOYEES.filter((e) => e.id !== 'e1' && e.name.toLowerCase().includes(q.trim().toLowerCase()))
  if (!shift) return null

  const toggle = (id: string) =>
    setSelected((cur) => (kind === 'swap' ? [id] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const canConfirm = kind === 'offer-all' || selected.length > 0

  return (
    <Modal open={!!shift} onClose={onClose} title="Offer this shift" description={`${positionName(shift.positionId)} · ${shortDate(shift.date)} · ${locationName(shift.locationId)}`}>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2">
          <KindBtn active={kind === 'swap'} onClick={() => { setKind('swap'); setSelected([]) }} icon={Repeat2} label="Swap 1:1" />
          <KindBtn active={kind === 'offer-all'} onClick={() => { setKind('offer-all'); setSelected([]) }} icon={Users} label="To everyone" />
          <KindBtn active={kind === 'offer-selected'} onClick={() => { setKind('offer-selected'); setSelected([]) }} icon={Send} label="Selected" />
        </div>

        {kind !== 'offer-all' && (
          <div>
            <div className="mb-2 flex h-9 items-center gap-2 rounded-xl bg-secondary/60 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coworkers…" className="h-full flex-1 bg-transparent text-sm outline-none" />
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto">
              {coworkers.map((e: Employee) => (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={cn('flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors', selected.includes(e.id) ? 'bg-primary/10' : 'hover:bg-secondary/60')}
                >
                  <Avatar src={e.avatar} name={e.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{positionName(e.positionId)}</p>
                  </div>
                  {selected.includes(e.id) && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message (optional)…"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-secondary/40 p-3 text-sm outline-none focus-ring"
        />

        <Button className="w-full" disabled={!canConfirm} onClick={() => onConfirm(kind, kind === 'swap' ? selected[0] ?? null : null, message || undefined)}>
          <Send className="h-4 w-4" /> Send offer
        </Button>
      </div>
    </Modal>
  )
}

function KindBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Users; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[12px] font-medium transition-colors',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary/60',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
