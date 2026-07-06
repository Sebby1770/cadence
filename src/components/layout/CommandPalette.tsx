import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft } from 'lucide-react'
import { EMPLOYEES, LOCATIONS } from '@/data/mock'
import { positionName } from '@/data/selectors'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { ALL_ITEMS, visibleFor } from './nav'

interface Cmd {
  id: string
  label: string
  hint?: string
  section: string
  to: string
  icon?: React.ReactNode
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const role = useStore((s) => s.role)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Cmd[]>(() => {
    const nav = ALL_ITEMS.filter((i) => visibleFor(role, i)).map((i) => ({
      id: `nav-${i.to}`,
      label: i.label,
      section: 'Navigate',
      to: i.to,
      icon: <i.icon className="h-4 w-4" />,
    }))
    const people = EMPLOYEES.map((e) => ({
      id: `emp-${e.id}`,
      label: e.name,
      hint: positionName(e.positionId),
      section: 'People',
      to: `/team?focus=${e.id}`,
      icon: <Avatar src={e.avatar} name={e.name} size="xs" />,
    }))
    const places = LOCATIONS.map((l) => ({
      id: `loc-${l.id}`,
      label: l.name,
      hint: l.region,
      section: 'Locations',
      to: `/locations?focus=${l.id}`,
    }))
    return [...nav, ...people, ...places]
  }, [role])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => (c.label + ' ' + (c.hint ?? '')).toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      }
      if (e.key === 'Enter' && filtered[active]) {
        navigate(filtered[active].to)
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, filtered, active, navigate, onClose])

  const grouped = useMemo(() => {
    const map = new Map<string, Cmd[]>()
    filtered.forEach((c) => {
      if (!map.has(c.section)) map.set(c.section, [])
      map.get(c.section)!.push(c)
    })
    return [...map.entries()]
  }, [filtered])

  let flatIndex = -1

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shifts, people, places, actions…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {grouped.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{query}”.</p>
              )}
              {grouped.map(([section, items]) => (
                <div key={section} className="mb-1">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {section}
                  </p>
                  {items.map((c) => {
                    flatIndex++
                    const idx = flatIndex
                    return (
                      <button
                        key={c.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => {
                          navigate(c.to)
                          onClose()
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm',
                          idx === active ? 'bg-secondary' : 'hover:bg-secondary/60',
                        )}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          {c.icon ?? <Search className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1 font-medium">{c.label}</span>
                        {c.hint && <span className="text-xs text-muted-foreground">{c.hint}</span>}
                        {idx === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
