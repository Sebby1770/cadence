import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { getEmployee } from '@/data/selectors'
import { positionName } from '@/data/selectors'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { NAV, visibleFor } from './nav'
import { RoleSwitcher } from './RoleSwitcher'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
          <path d="M12 4a8 8 0 1 0 7.5 10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 7v5l3 1.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight">Cadence</p>
        <p className="text-[11px] text-muted-foreground">Shift Studio</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const role = useStore((s) => s.role)
  const me = getEmployee(useStore((s) => s.currentUserId))
  const unreadNotif = useStore((s) => s.notifications.filter((n) => !n.read).length)
  const pendingReq = useStore((s) => s.swaps.filter((x) => x.status === 'pending').length)
  const unreadMsg = useStore((s) => s.threads.reduce((a, t) => a + t.unread, 0))

  const badgeFor = (key?: string) =>
    key === 'notifications' ? unreadNotif : key === 'requests' ? pendingReq : key === 'messages' ? unreadMsg : 0

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border bg-card/40 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-4">
        <Logo />
      </div>

      <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV.map((group) => {
          const items = group.items.filter((i) => visibleFor(role, i))
          if (!items.length) return null
          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const count = badgeFor(item.badgeKey)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-active"
                              className="absolute inset-0 rounded-xl bg-secondary"
                              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                            />
                          )}
                          <item.icon className="relative z-10 h-[18px] w-[18px]" strokeWidth={2.1} />
                          <span className="relative z-10 flex-1">{item.label}</span>
                          {count > 0 && (
                            <span className="relative z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                              {count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <RoleSwitcher />
        <NavLink
          to="/profile"
          className="mt-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/70"
        >
          {me && <Avatar src={me.avatar} name={me.name} size="md" status="working" />}
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13.5px] font-semibold">{me?.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{me && positionName(me.positionId)}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
