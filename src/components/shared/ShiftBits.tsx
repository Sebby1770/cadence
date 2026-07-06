import { MapPin, Clock } from 'lucide-react'
import { cn, currency, minutesToLabel } from '@/lib/utils'
import {
  departmentKey,
  getEmployee,
  locationShort,
  positionName,
  shiftHours,
  shiftPay,
} from '@/data/selectors'
import type { DeptKey, Shift } from '@/data/types'
import { Avatar, DeptDot } from '@/components/ui'

const DEPT_BG: Record<DeptKey, string> = {
  floor: 'bg-dept-floor/10 border-dept-floor/30 text-dept-floor',
  kitchen: 'bg-dept-kitchen/10 border-dept-kitchen/30 text-dept-kitchen',
  bar: 'bg-dept-bar/10 border-dept-bar/30 text-dept-bar',
  sales: 'bg-dept-sales/10 border-dept-sales/30 text-dept-sales',
  support: 'bg-dept-support/10 border-dept-support/30 text-dept-support',
  management: 'bg-dept-management/10 border-dept-management/30 text-dept-management',
}

export const deptBg = (dept: DeptKey) => DEPT_BG[dept]

/** Compact colored shift block for calendar cells. */
export function ShiftChip({ shift, onClick, compact }: { shift: Shift; onClick?: () => void; compact?: boolean }) {
  const dept = departmentKey(shift.departmentId)
  const emp = getEmployee(shift.employeeId)
  const open = shift.status === 'open'
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full rounded-lg border px-2 py-1 text-left text-[11px] leading-tight transition-all hover:shadow-soft',
        open ? 'border-dashed border-primary/40 bg-primary/5 text-primary' : DEPT_BG[dept],
      )}
    >
      <div className="flex items-center gap-1 font-semibold">
        <span className="tabular">{minutesToLabel(shift.start)}</span>
      </div>
      {!compact && (
        <div className="mt-0.5 flex items-center gap-1 text-foreground/80">
          {open ? (
            <span className="font-medium">Open · {positionName(shift.positionId)}</span>
          ) : (
            <>
              {emp && <Avatar src={emp.avatar} name={emp.name} size="xs" className="h-4 w-4" />}
              <span className="truncate">{emp?.firstName ?? positionName(shift.positionId)}</span>
            </>
          )}
        </div>
      )}
    </button>
  )
}

/** Rich list row for a shift (dashboard, schedule side panel, marketplace). */
export function ShiftListItem({
  shift,
  showPay,
  right,
  onClick,
}: {
  shift: Shift
  showPay?: boolean
  right?: React.ReactNode
  onClick?: () => void
}) {
  const dept = departmentKey(shift.departmentId)
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors',
        onClick && 'cursor-pointer hover:bg-secondary/50',
      )}
    >
      <div className={cn('flex h-10 w-1.5 shrink-0 rounded-full', `bg-dept-${dept}`)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{positionName(shift.positionId)}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {minutesToLabel(shift.start)}–{minutesToLabel(shift.end)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locationShort(shift.locationId)}
          </span>
          <span className="inline-flex items-center gap-1">
            <DeptDot dept={dept} /> {shiftHours(shift).toFixed(1)}h
          </span>
        </div>
      </div>
      {showPay && (
        <div className="text-right">
          <p className="text-sm font-bold tabular">{currency(shiftPay(shift))}</p>
          <p className="text-[10px] text-muted-foreground">est.</p>
        </div>
      )}
      {right}
    </div>
  )
}
