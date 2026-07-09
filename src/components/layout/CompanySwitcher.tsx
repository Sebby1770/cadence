import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, ChevronsUpDown, Plus, LogIn, Check, Copy, Sparkles, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { isSupabaseEnabled } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button, Modal } from '@/components/ui'

function CompanyGlyph({ name, accent, size = 32 }: { name: string; accent: string; size?: number }) {
  const letter = name.trim()[0]?.toUpperCase() ?? 'C'
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg font-bold text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${accent}), hsl(${accent} / 0.7))`, fontSize: size * 0.42 }}
    >
      {letter}
    </span>
  )
}

export function CompanySwitcher() {
  const companies = useStore((s) => s.companies)
  const activeId = useStore((s) => s.activeCompanyId)
  const switchCompany = useStore((s) => s.switchCompany)
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<'create' | 'join' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const active = companies.find((c) => c.id === activeId) ?? companies[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card/60 p-2 text-left transition-colors hover:bg-secondary/70"
      >
        {active && <CompanyGlyph name={active.name} accent={active.accent} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight">{active?.name ?? 'Select workspace'}</p>
          <p className="truncate text-[11px] text-muted-foreground">{companies.length} workspace{companies.length === 1 ? '' : 's'}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-elevated"
          >
            <p className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">Workspaces</p>
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setOpen(false)
                    if (c.id !== activeId) switchCompany(c.id)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-secondary"
                >
                  <CompanyGlyph name={c.name} accent={c.accent} size={26} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.name}</span>
                  {c.id === activeId && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="my-1.5 h-px bg-border" />
            <button
              onClick={() => { setOpen(false); setModal('create') }}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-[13px] font-medium transition-colors hover:bg-secondary"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/12 text-primary"><Plus className="h-4 w-4" /></span>
              Create a workspace
            </button>
            <button
              onClick={() => { setOpen(false); setModal('join') }}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-[13px] font-medium transition-colors hover:bg-secondary"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground"><LogIn className="h-4 w-4" /></span>
              Join with a code
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateModal open={modal === 'create'} onClose={() => setModal(null)} />
      <JoinModal open={modal === 'join'} onClose={() => setModal(null)} />
    </div>
  )
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createCompany = useStore((s) => s.createCompany)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    await createCompany(name.trim())
    setBusy(false)
    setName('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a workspace" description="Spin up a fresh company with a starter team and schedule.">
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Company name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. Northside Bakery"
            className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-ring"
          />
        </div>
        <div className="rounded-xl bg-secondary/40 p-3 text-[13px] text-muted-foreground">
          We’ll set you up as the owner with three departments, a location, a sample team, and a few days of shifts — ready to customise.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {busy ? 'Creating…' : 'Create workspace'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function JoinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const joinCompany = useStore((s) => s.joinCompany)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!code.trim()) return
    setBusy(true)
    const c = await joinCompany(code.trim())
    setBusy(false)
    if (c) {
      setCode('')
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join a workspace" description="Enter the invite code your manager shared.">
      <div className="space-y-4 p-5">
        {!isSupabaseEnabled && (
          <p className="rounded-lg bg-warning/10 p-2.5 text-[13px] text-warning">Joining requires the Supabase backend to be connected.</p>
        )}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Invite code</label>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. DEMO24"
            maxLength={8}
            className="h-11 w-full rounded-xl border border-input bg-card px-3.5 font-mono text-sm tracking-widest outline-none focus-ring"
          />
          <p className="mt-1.5 text-[12px] text-muted-foreground">Tip: try <span className="font-mono font-semibold">DEMO24</span> for the demo company.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !code.trim()}>{busy ? 'Joining…' : 'Join'}</Button>
        </div>
      </div>
    </Modal>
  )
}

/** First-run modal offering the three ways to plug in. */
export function CompanyOnboarding() {
  const [show, setShow] = useState(false)
  const activeId = useStore((s) => s.activeCompanyId)
  const createCompany = useStore((s) => s.createCompany)
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const joinCompany = useStore((s) => s.joinCompany)

  useEffect(() => {
    try {
      if (!localStorage.getItem('cadence-onboarded')) setShow(true)
    } catch {
      /* ignore */
    }
  }, [])

  const done = () => {
    try { localStorage.setItem('cadence-onboarded', '1') } catch { /* ignore */ }
    setShow(false)
  }

  const create = async () => {
    if (!name.trim()) return
    setBusy(true); await createCompany(name.trim()); setBusy(false); done()
  }
  const join = async () => {
    if (!code.trim()) return
    setBusy(true); const c = await joinCompany(code.trim()); setBusy(false); if (c) done()
  }

  return (
    <Modal open={show} onClose={done} hideClose className="sm:max-w-md">
      <div className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Welcome to Cadence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The scheduling platform any company can plug into. How would you like to start?
        </p>

        {mode === 'menu' && (
          <div className="mt-5 space-y-2.5">
            <button onClick={done} className="group flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:bg-secondary/60">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary"><Building2 className="h-5 w-5" /></span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Explore the demo</span>
                <span className="block text-xs text-muted-foreground">Cadence Coffee Co. — a fully-loaded example.</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
            <button onClick={() => setMode('create')} className="group flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:bg-secondary/60">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dept-support/15 text-dept-support"><Plus className="h-5 w-5" /></span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Create your company</span>
                <span className="block text-xs text-muted-foreground">Start a new workspace with a starter team.</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
            <button onClick={() => setMode('join')} className="group flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:bg-secondary/60">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dept-bar/15 text-dept-bar"><LogIn className="h-5 w-5" /></span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Join with a code</span>
                <span className="block text-xs text-muted-foreground">Your manager gave you an invite code.</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="mt-5 space-y-3">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder="Company name" className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus-ring" />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMode('menu')}>Back</Button>
              <Button className="flex-1" onClick={create} disabled={busy || !name.trim()}>{busy ? 'Creating…' : 'Create workspace'}</Button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="mt-5 space-y-3">
            <input autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && join()} placeholder="Invite code (try DEMO24)" maxLength={8} className="h-11 w-full rounded-xl border border-input bg-card px-3.5 font-mono text-sm tracking-widest outline-none focus-ring" />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMode('menu')}>Back</Button>
              <Button className="flex-1" onClick={join} disabled={busy || !code.trim()}>{busy ? 'Joining…' : 'Join workspace'}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
