import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view. Always true when motion is reduced or unsupported. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined' || reduced())
  useEffect(() => {
    if (seen) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return [ref, seen] as const
}

/** Section entrance: one gentle fade and rise (987ms) when the block scrolls into view. `i` staggers siblings by 55ms. */
export default function Reveal({ children, i = 0, className = '' }: { children: ReactNode; i?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`${seen ? 'enter' : 'opacity-0'} ${className}`} style={{ ['--i' as string]: i } as CSSProperties}>
      {children}
    </div>
  )
}

/** A figure that counts up to its value (987ms) when it scrolls into view, and eases to new values (377ms). */
export function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>()
  const [shown, setShown] = useState(() => (reduced() ? value : 0))
  const current = useRef(shown)
  const firstRun = useRef(true)

  useEffect(() => {
    if (!seen) return
    if (reduced()) {
      current.current = value
      setShown(value)
      return
    }
    const from = current.current
    const dur = firstRun.current ? 987 : 377
    firstRun.current = false
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(from + (value - from) * eased)
      current.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, value])

  return <span ref={ref} className={className}>{shown}</span>
}
