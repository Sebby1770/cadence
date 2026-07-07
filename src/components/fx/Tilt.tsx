import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/** 3D tilt-toward-cursor wrapper (disabled for touch / reduced-motion). */
export function Tilt({
  children,
  className,
  max = 8,
  scale = 1.02,
}: {
  children: ReactNode
  className?: string
  max?: number
  scale?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const srx = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 18 })
  const sry = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 18 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        px.set((e.clientX - r.left) / r.width - 0.5)
        py.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => {
        px.set(0)
        py.set(0)
      }}
      whileHover={{ scale }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  )
}
