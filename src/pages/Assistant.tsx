import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, ArrowUp } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import { EMPLOYEES, LOCATIONS } from '@/data/mock'
import type { Employee, Shift } from '@/data/types'
import {
  coverage,
  departmentName,
  getEmployee,
  locationName,
  nextShift,
  openShifts,
  positionName,
  shiftPay,
  weeklyHours,
} from '@/data/selectors'
import { cn, currency, formatHours, minutesToLabel } from '@/lib/utils'
import { iso, weekDates } from '@/lib/dates'
import { Avatar } from '@/components/ui'
import { ShiftListItem } from '@/components/shared/ShiftBits'

interface Msg {
  id: number
  role: 'user' | 'assistant'
  text: string
  employees?: Employee[]
  shifts?: Shift[]
}

const SUGGESTIONS = [
  'When am I working next?',
  "Who's working now?",
  'Which locations are understaffed?',
  'How many hours this week?',
  'Who can cover Friday night?',
  'What are my open shifts?',
]

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function Assistant() {
  const now = useNow(60_000)
  const shifts = useStore((s) => s.shifts)
  const currentUserId = useStore((s) => s.currentUserId)
  const me = getEmployee(currentUserId)!

  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: 'assistant', text: `Hi ${me.firstName} 👋 I’m Cadence AI. Ask me about your schedule, open shifts, who’s working, or staffing — I’ll answer from live data.` },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const idRef = useRef(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const engine = useMemo(() => buildEngine(shifts, now, me), [shifts, now, me])

  const ask = (q: string) => {
    const question = q.trim()
    if (!question) return
    setMessages((m) => [...m, { id: idRef.current++, role: 'user', text: question }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const res = engine(question)
      setTyping(false)
      setMessages((m) => [...m, { id: idRef.current++, role: 'assistant', ...res }])
    }, 650)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9.5rem)] w-full max-w-3xl flex-col lg:h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cadence AI</h1>
          <p className="text-sm text-muted-foreground">Answers from your live schedule</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card/40 p-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}
            >
              {m.role === 'assistant' ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white"><Sparkles className="h-4 w-4" /></span>
              ) : (
                <Avatar src={me.avatar} name={me.name} size="sm" />
              )}
              <div className={cn('max-w-[80%] space-y-2', m.role === 'user' && 'items-end')}>
                <div className={cn('rounded-2xl px-4 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-secondary')}>
                  {m.text}
                </div>
                {m.employees && m.employees.length > 0 && (
                  <div className="space-y-1.5">
                    {m.employees.map((e) => (
                      <div key={e.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
                        <Avatar src={e.avatar} name={e.name} size="sm" status="working" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{e.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{positionName(e.positionId)} · {departmentName(e.departmentId)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.shifts && m.shifts.length > 0 && (
                  <div className="space-y-1.5">
                    {m.shifts.map((s) => <ShiftListItem key={s.id} shift={s} showPay />)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white"><Sparkles className="h-4 w-4" /></span>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 pt-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="flex items-center gap-2 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(input)}
          placeholder="Ask Cadence anything…"
          className="h-12 flex-1 rounded-2xl border border-border bg-card px-4 text-sm outline-none focus-ring"
        />
        <button onClick={() => ask(input)} disabled={!input.trim()} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40" aria-label="Send">
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function buildEngine(shifts: Shift[], now: Date, me: Employee) {
  return (raw: string): Omit<Msg, 'id' | 'role'> => {
    const q = raw.toLowerCase()

    // Next shift
    if ((q.includes('next') || (q.includes('when') && q.includes('work'))) && !q.includes('who')) {
      const next = nextShift(shifts, me.id, now)
      if (!next) return { text: 'You have no upcoming shifts scheduled. Enjoy the time off!' }
      const d = new Date(`${next.date}T00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      return { text: `Your next shift is ${d}, ${minutesToLabel(next.start)}–${minutesToLabel(next.end)} as ${positionName(next.positionId)} at ${locationName(next.locationId)}.`, shifts: [next] }
    }

    // Who's working now
    if (q.includes('who') && (q.includes('now') || q.includes('working') || q.includes('on shift'))) {
      const todayIso = iso(now)
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const active = shifts
        .filter((s) => s.date === todayIso && s.employeeId && nowMin >= s.start && nowMin < s.end)
        .map((s) => getEmployee(s.employeeId!)!)
        .filter(Boolean)
      if (!active.length) return { text: 'Nobody is clocked in right now.' }
      return { text: `There ${active.length === 1 ? 'is' : 'are'} ${active.length} teammate${active.length === 1 ? '' : 's'} on shift right now:`, employees: active.slice(0, 6) }
    }

    // Understaffed locations
    if (q.includes('understaff') || q.includes('short') || q.includes('coverage') || q.includes('cover') && q.includes('location')) {
      const todayIso = iso(now)
      const under = LOCATIONS.map((l) => ({ l, c: coverage(shifts, l.id, todayIso) })).filter((x) => x.c < 0.85).sort((a, b) => a.c - b.c)
      if (!under.length) return { text: 'Every location is well staffed today. 🎉' }
      const lines = under.map((x) => `• ${x.l.name} — ${Math.round(x.c * 100)}% of target`).join('\n')
      return { text: `${under.length} location${under.length === 1 ? ' looks' : 's look'} understaffed today:\n${lines}` }
    }

    // Hours this week
    if (q.includes('hour') || (q.includes('how many') && q.includes('week'))) {
      const wk = weeklyHours(shifts, me.id, weekDates(now))
      const pref = me.availability.preferred
      const diff = pref - wk
      return { text: `You’re scheduled for ${formatHours(wk)} this week — ${wk >= pref ? `${formatHours(Math.abs(diff))} over` : `${formatHours(diff)} under`} your ${pref}h preference.` }
    }

    // Who can cover a day / night
    if (q.includes('cover') || DAY_NAMES.some((d) => q.includes(d))) {
      const dayIdx = DAY_NAMES.findIndex((d) => q.includes(d))
      const targetDow = dayIdx >= 0 ? dayIdx : 5
      // next date matching that weekday
      let date = new Date(now)
      for (let i = 0; i < 8; i++) {
        if (date.getDay() === targetDow && date > now) break
        date = new Date(date.getTime() + 86400000)
      }
      const dateIso = iso(date)
      const wantNight = q.includes('night') || q.includes('evening')
      const open = shifts.filter((s) => s.date === dateIso && s.status === 'open' && (!wantNight || s.start >= 17 * 60))
      const depts = new Set(open.map((s) => s.departmentId))
      const candidates = EMPLOYEES.filter(
        (e) => e.role === 'employee' && (depts.size === 0 || depts.has(e.departmentId)) && e.availability.windows[targetDow] &&
          !shifts.some((s) => s.date === dateIso && s.employeeId === e.id),
      ).slice(0, 4)
      const label = DAY_NAMES[targetDow][0].toUpperCase() + DAY_NAMES[targetDow].slice(1)
      if (!candidates.length) return { text: `I couldn’t find free, qualified staff for ${label}${wantNight ? ' night' : ''}. You may need to post an open shift or broadcast to all staff.` }
      return { text: `For ${label}${wantNight ? ' night' : ''}, ${open.length} shift${open.length === 1 ? '' : 's'} ${open.length === 1 ? 'is' : 'are'} open. These teammates are available and qualified:`, employees: candidates }
    }

    // Open shifts / marketplace
    if (q.includes('open') || q.includes('marketplace') || q.includes('pick up') || q.includes('available shift')) {
      const open = openShifts(shifts).sort((a, b) => shiftPay(b) - shiftPay(a))
      if (!open.length) return { text: 'There are no open shifts right now.' }
      return { text: `There are ${open.length} open shifts on the marketplace. Here are the best-paying ones:`, shifts: open.slice(0, 3) }
    }

    return {
      text: 'I can help with your schedule and staffing. Try:\n• “When am I working next?”\n• “Who’s working now?”\n• “Which locations are understaffed?”\n• “How many hours this week?”\n• “Who can cover Friday night?”\n• “What are my open shifts?”',
    }
  }
}
