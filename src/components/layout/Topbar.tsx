import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Sun, Moon, Sparkles } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useTheme } from '@/lib/theme'
import { getEmployee } from '@/data/selectors'
import { Avatar } from '@/components/ui'

export function Topbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const me = getEmployee(useStore((s) => s.currentUserId))
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-8">
      {/* Mobile logo */}
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
            <path d="M12 4a8 8 0 1 0 7.5 10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M12 7v5l3 1.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[15px] font-bold tracking-tight">Cadence</span>
      </Link>

      {/* Search */}
      <button
        onClick={onOpenCommand}
        className="group ml-auto flex h-9 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary lg:ml-0 lg:mr-auto lg:w-80"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search shifts, people, places…</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] lg:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <Link
          to="/assistant"
          className="hidden h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary/12 to-purple-500/12 px-3 text-[13px] font-medium text-primary transition-colors hover:from-primary/20 hover:to-purple-500/20 sm:inline-flex"
        >
          <Sparkles className="h-4 w-4" />
          Ask Cadence
        </Link>

        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
              {unread}
            </span>
          )}
        </button>

        <Link to="/profile" className="ml-1 lg:hidden">
          {me && <Avatar src={me.avatar} name={me.name} size="sm" />}
        </Link>
      </div>
    </header>
  )
}
