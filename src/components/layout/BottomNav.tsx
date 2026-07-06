import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { BOTTOM_ITEMS } from './nav'

export function BottomNav() {
  const unreadMsg = useStore((s) => s.threads.reduce((a, t) => a + t.unread, 0))

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="bottom-active"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  <item.icon className="h-[22px] w-[22px]" strokeWidth={2.1} />
                  {item.badgeKey === 'messages' && unreadMsg > 0 && (
                    <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
                  )}
                </span>
                {item.label.split(' ')[0]}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
