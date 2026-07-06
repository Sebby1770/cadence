import { UserCog, Briefcase, Shield } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Role } from '@/data/types'
import { cn } from '@/lib/utils'

const ROLES: { value: Role; label: string; icon: typeof UserCog }[] = [
  { value: 'employee', label: 'Employee', icon: Briefcase },
  { value: 'manager', label: 'Manager', icon: UserCog },
  { value: 'admin', label: 'Admin', icon: Shield },
]

export function RoleSwitcher() {
  const role = useStore((s) => s.role)
  const setRole = useStore((s) => s.setRole)
  return (
    <div>
      <p className="mb-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Viewing as
      </p>
      <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/50 p-1">
        {ROLES.map((r) => {
          const active = r.value === role
          return (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11.5px] font-medium transition-colors',
                active ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
              )}
              title={`View as ${r.label}`}
            >
              <r.icon className="h-3.5 w-3.5" />
              {r.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
