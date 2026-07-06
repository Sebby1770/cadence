import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Store, Repeat2, Megaphone, CalendarDays, Plane, Clock, Award, CheckCheck, Bell, Smartphone, Mail, MessageSquare } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNow } from '@/hooks/useNow'
import type { AppNotification, NotificationKind } from '@/data/types'
import { getEmployee } from '@/data/selectors'
import { cn, relativeTime } from '@/lib/utils'
import { Avatar, Button, Card, EmptyState, Segmented } from '@/components/ui'
import { PageHeader, PageShell } from '@/components/layout/PageHeader'

const ICON: Record<NotificationKind, { icon: typeof Bell; color: string }> = {
  'shift-approved': { icon: CheckCircle2, color: 'text-success bg-success/12' },
  'shift-picked': { icon: Store, color: 'text-dept-bar bg-dept-bar/12' },
  swap: { icon: Repeat2, color: 'text-primary bg-primary/12' },
  announcement: { icon: Megaphone, color: 'text-dept-kitchen bg-dept-kitchen/12' },
  roster: { icon: CalendarDays, color: 'text-dept-floor bg-dept-floor/12' },
  leave: { icon: Plane, color: 'text-dept-support bg-dept-support/12' },
  reminder: { icon: Clock, color: 'text-warning bg-warning/12' },
  badge: { icon: Award, color: 'text-amber-500 bg-amber-500/12' },
}

export default function Notifications() {
  const now = useNow(60_000)
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markRead)
  const markAllRead = useStore((s) => s.markAllRead)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false })

  const list = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  const todayStr = now.toDateString()
  const { today, earlier } = useMemo(() => {
    const t: AppNotification[] = []
    const e: AppNotification[] = []
    list.forEach((n) => (new Date(n.createdAt).toDateString() === todayStr ? t : e).push(n))
    return { today: t, earlier: e }
  }, [list, todayStr])

  const unread = notifications.filter((n) => !n.read).length

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You’re all caught up'}
        actions={
          <div className="flex items-center gap-2">
            <Segmented options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }]} value={filter} onChange={setFilter} layoutId="notif-filter" />
            <Button variant="outline" onClick={markAllRead} disabled={!unread}><CheckCheck className="h-4 w-4" /> Mark all read</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {list.length === 0 ? (
            <EmptyState icon={Bell} title="Nothing here" description={filter === 'unread' ? 'No unread notifications.' : 'Notifications will appear here.'} />
          ) : (
            <>
              {today.length > 0 && <Group title="Today" items={today} onRead={markRead} />}
              {earlier.length > 0 && <Group title="Earlier" items={earlier} onRead={markRead} />}
            </>
          )}
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-3 text-[15px] font-semibold">Preferences</h3>
          <div className="space-y-2">
            <PrefRow icon={Smartphone} label="Push notifications" on={prefs.push} onClick={() => setPrefs((p) => ({ ...p, push: !p.push }))} />
            <PrefRow icon={Mail} label="Email" on={prefs.email} onClick={() => setPrefs((p) => ({ ...p, email: !p.email }))} />
            <PrefRow icon={MessageSquare} label="SMS" on={prefs.sms} onClick={() => setPrefs((p) => ({ ...p, sms: !p.sms }))} />
          </div>
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            You’ll always get critical alerts about your own shifts, even with notifications off.
          </p>
        </Card>
      </div>
    </PageShell>
  )
}

function Group({ title, items, onRead }: { title: string; items: AppNotification[]; onRead: (id: string) => void }) {
  return (
    <div>
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <Card className="divide-y divide-border overflow-hidden">
        <AnimatePresence initial={false}>
          {items.map((n) => {
            const meta = ICON[n.kind]
            const actor = getEmployee(n.actorId)
            return (
              <motion.button
                key={n.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => onRead(n.id)}
                className={cn('flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/40', !n.read && 'bg-primary/[0.04]')}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.color)}>
                  <meta.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {actor && <Avatar src={actor.avatar} name={actor.name} size="xs" />}
                    <p className="text-sm font-semibold">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{relativeTime(n.createdAt)}</p>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </Card>
    </div>
  )
}

function PrefRow({ icon: Icon, label, on, onClick }: { icon: typeof Bell; label: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground"><Icon className="h-4 w-4" /></span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <button onClick={onClick} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-secondary')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-5' : 'left-0.5')} />
      </button>
    </div>
  )
}
