import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A container that reveals a soft radial spotlight following the cursor. */
export function SpotlightCard({
  children,
  className,
  color = 'hsl(var(--primary) / 0.16)',
  radius = 380,
}: {
  children: ReactNode
  className?: string
  color?: string
  radius?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [on, setOn] = useState(false)

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
      }}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={cn('relative overflow-hidden', className)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: on ? 1 : 0,
          background: `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 45%)`,
        }}
      />
      {children}
    </div>
  )
}
