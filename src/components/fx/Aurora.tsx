import { cn } from '@/lib/utils'

/** Drifting, blurred aurora blobs for an ambient premium backdrop. */
export function Aurora({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="animate-aurora-1 absolute -left-[10%] -top-[15%] h-[55vh] w-[55vh] rounded-full blur-[110px]"
        style={{ background: `hsl(var(--primary) / ${0.28 * intensity})` }}
      />
      <div
        className="animate-aurora-2 absolute right-[5%] top-[10%] h-[50vh] w-[50vh] rounded-full blur-[120px]"
        style={{ background: `hsl(262 83% 66% / ${0.22 * intensity})` }}
      />
      <div
        className="animate-aurora-3 absolute bottom-[-10%] left-[30%] h-[45vh] w-[45vh] rounded-full blur-[120px]"
        style={{ background: `hsl(190 90% 55% / ${0.16 * intensity})` }}
      />
    </div>
  )
}

/** A subtle SVG noise/grain overlay to add texture over flat surfaces. */
export function Grain({ className, opacity = 0.035 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 mix-blend-overlay', className)}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}
