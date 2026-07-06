import { useEffect, useMemo, useRef, useState } from 'react'
import { User, Users, Store, Building2, Clock, Search, Send, ArrowLeft, Megaphone } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { ChatThread } from '@/data/types'
import { getEmployee } from '@/data/selectors'
import { cn, relativeTime } from '@/lib/utils'
import { Avatar, AvatarStack, Button } from '@/components/ui'

const KIND_ICON = { direct: User, group: Users, store: Store, department: Building2, shift: Clock }

export default function Messages() {
  const isMobile = useIsMobile()
  const threads = useStore((s) => s.threads)
  const currentUserId = useStore((s) => s.currentUserId)
  const sendMessage = useStore((s) => s.sendMessage)
  const readThread = useStore((s) => s.readThread)
  const addToast = useStore((s) => s.addToast)

  const [activeId, setActiveId] = useState<string>(threads[0]?.id ?? '')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const active = threads.find((t) => t.id === activeId)
  const filtered = useMemo(
    () => threads.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase())),
    [threads, q],
  )

  useEffect(() => {
    if (active) readThread(active.id)
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [active?.messages.length, activeId])

  const send = () => {
    if (!draft.trim() || !active) return
    sendMessage(active.id, draft.trim())
    setDraft('')
  }

  const showList = !isMobile || !active || activeId === '__list'

  return (
    <div className="mx-auto flex h-[calc(100vh-9.5rem)] w-full max-w-[1400px] gap-4 lg:h-[calc(100vh-7rem)]">
      {/* Thread list */}
      {(!isMobile || showList) && (
        <div className={cn('flex flex-col rounded-2xl border border-border bg-card', isMobile ? 'w-full' : 'w-80 shrink-0')}>
          <div className="flex items-center justify-between gap-2 border-b border-border p-3">
            <h2 className="text-lg font-bold tracking-tight">Messages</h2>
            <Button size="sm" variant="outline" onClick={() => addToast({ title: 'Broadcast sent to all staff', kind: 'success' })}>
              <Megaphone className="h-3.5 w-3.5" /> Broadcast
            </Button>
          </div>
          <div className="p-2">
            <div className="flex h-9 items-center gap-2 rounded-xl bg-secondary/60 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…" className="h-full flex-1 bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2 pt-0">
            {filtered.map((t) => {
              const Icon = KIND_ICON[t.kind]
              const last = t.messages[t.messages.length - 1]
              const lastSender = getEmployee(last?.senderId)
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={cn('flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors', t.id === activeId && !isMobile ? 'bg-secondary' : 'hover:bg-secondary/60')}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-purple-500/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      {last && <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(last.createdAt)}</span>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {last ? `${lastSender?.firstName ?? ''}: ${last.body}` : 'No messages yet'}
                    </p>
                  </div>
                  {t.unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{t.unread}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Conversation */}
      {active && (!isMobile || !showList) && (
        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border p-3">
            {isMobile && (
              <button onClick={() => setActiveId('__list')} className="rounded-lg p-1.5 hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></button>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{active.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{active.kind} · {active.participantIds.length} people</p>
            </div>
            <AvatarStack
              names={active.participantIds.map((id) => getEmployee(id)?.name ?? '?')}
              srcs={active.participantIds.map((id) => getEmployee(id)?.avatar)}
              max={4}
            />
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {active.messages.map((m) => {
              const mine = m.senderId === currentUserId
              const sender = getEmployee(m.senderId)
              return (
                <div key={m.id} className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
                  {!mine && sender && <Avatar src={sender.avatar} name={sender.name} size="sm" />}
                  <div className={cn('max-w-[75%]')}>
                    {!mine && <p className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">{sender?.firstName}</p>}
                    <div className={cn('rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-secondary')}>
                      {m.body}
                    </div>
                    <p className={cn('mt-0.5 px-1 text-[10px] text-muted-foreground', mine && 'text-right')}>{relativeTime(m.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${active.name}…`}
              className="h-10 flex-1 rounded-xl bg-secondary/60 px-3.5 text-sm outline-none focus-ring"
            />
            <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
