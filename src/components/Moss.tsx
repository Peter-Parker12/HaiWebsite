import { useMemo } from 'react'

/**
 * Moss is the brand's sign of life and it means one thing: a need has been met.
 * Four states follow the project's data, never taste:
 *   dormant  resting, grey        (Closed, Unavailable, Declined)
 *   open     sparse, terracotta   (Seeking support, Missing, Partially funded)
 *   growing  medium moss          (Running, In progress, Contacted, Requested, Saved)
 *   secured  dense, new tips      (Secured, Accepted, Done, Supporting)
 * Drawn as dots on a base line. Positions are deterministic so a given card never changes.
 * Growth runs outward from the base in steps (610ms) and stops under prefers-reduced-motion.
 */
export type MossState = 'dormant' | 'open' | 'growing' | 'secured'

// Dots per square pixel of the frame, so a small cushion and a large one read the same.
const DENSITY: Record<MossState, number> = { dormant: 0.004, open: 0.0075, growing: 0.0117, secured: 0.0203 }

// Small seeded generator (mulberry32) so the same seed always draws the same moss.
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Dot {
  x: number
  y: number
  r: number
  fill: string
  layer: number
}

function dots(state: MossState, w: number, h: number, seed: number): Dot[] {
  const rand = rng(seed)
  const out: Dot[] = []
  const n = Math.max(10, Math.round(DENSITY[state] * w * h))
  for (let i = 0; i < n; i++) {
    // Points fill a half-ellipse that rests on the base line.
    const a = Math.PI * (0.04 + 0.92 * rand())
    const d = Math.sqrt(rand())
    const x = w / 2 + Math.cos(a) * d * (w / 2 - 6)
    const y = h - 2 - Math.sin(a) * d * (h - 8)
    const lift = 1 - (h - y) / h // 0 at the base, 1 at the crown
    let fill = '#5d7a49' // moss-500
    let r = 1.5 + rand() * 1.8
    if (state === 'dormant') {
      fill = '#4b5563' // gray-600, flat and dry
      r = 1.3 + rand() * 1.4
    } else if (state === 'open') {
      fill = lift > 0.6 && rand() > 0.45 ? '#c4663d' : rand() > 0.5 ? '#5d7a49' : '#3f5631' // terracotta tips on sparse moss
    } else if (state === 'growing') {
      fill = rand() > 0.5 ? '#5d7a49' : '#3f5631'
    } else {
      fill = lift > 0.7 && rand() > 0.4 ? '#a3c08c' : rand() > 0.55 ? '#5d7a49' : '#3f5631' // moss-300 new growth
    }
    out.push({ x, y, r, fill, layer: Math.min(2, Math.floor(lift * 3)) })
  }
  return out
}

export function MossCushion({
  state,
  width = 144,
  height = 55,
  seed = 8,
  className = '',
  label,
}: {
  state: MossState
  width?: number
  height?: number
  seed?: number
  className?: string
  /** Screen-reader text. Decorative moss has none; the chip beside it carries the word. */
  label?: string
}) {
  const items = useMemo(() => dots(state, width, height, seed), [state, width, height, seed])
  const grows = state !== 'dormant'
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="#e6d7bd" strokeWidth="1" />
      {items.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={d.fill}
          className={grows ? 'animate-grow' : undefined}
          style={grows ? { transformOrigin: `${d.x}px ${height}px`, animationDelay: `${d.layer * 610}ms` } : undefined}
        />
      ))}
    </svg>
  )
}

/** One secured resource: a thin stalk with a capsule. */
export function Sporophyte({ height = 34, className = '' }: { height?: number; className?: string }) {
  return (
    <svg width="10" height={height} viewBox={`0 0 10 ${height}`} aria-hidden="true" className={className}>
      <line x1="5" y1={height} x2="5" y2="8" stroke="#5d7a49" strokeWidth="1.2" />
      <ellipse cx="5" cy="5" rx="3" ry="4.4" fill="#3f5631" className="animate-grow" style={{ transformOrigin: `5px ${height}px` }} />
      <circle cx="5.6" cy="3.6" r="1" fill="#a3c08c" />
    </svg>
  )
}

/** Hero art: one cushion with three sporophytes, resting on the band's lower edge. Golden proportions (233 x 144). */
export function HeroMoss({ className = '' }: { className?: string }) {
  const W = 233
  const H = 144
  const cushionH = 89
  const items = useMemo(() => dots('secured', W, cushionH, 13), [])
  const stalks: [number, number][] = [[82, 58], [124, 36], [156, 47]] // x, stalk height
  const base = H - 26 // stalks rise from inside the cushion
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={className} preserveAspectRatio="xMidYMax meet">
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="#e6d7bd" strokeWidth="1" />
      <g transform={`translate(0 ${H - cushionH})`}>
        {items.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={d.fill}
            className="animate-grow"
            style={{ transformOrigin: `${d.x}px ${cushionH}px`, animationDelay: `${d.layer * 610}ms` }}
          />
        ))}
      </g>
      {stalks.map(([x, h], i) => (
        <g key={i} className="animate-grow" style={{ transformOrigin: `${x}px ${base}px`, animationDelay: `${1220 + i * 55}ms` }}>
          <line x1={x} y1={base} x2={x} y2={base - h} stroke="#5d7a49" strokeWidth="1.6" />
          <ellipse cx={x} cy={base - h - 4} rx="3.6" ry="5.4" fill="#3f5631" />
          <circle cx={x + 0.8} cy={base - h - 6} r="1.2" fill="#a3c08c" />
        </g>
      ))}
    </svg>
  )
}

/** A growing line of moss along a base. `share` is how much of it has been secured (0 to 1). */
export function CarpetEdge({ share, className = '' }: { share: number; className?: string }) {
  const n = 48
  const grown = Math.round(Math.max(0, Math.min(1, share)) * n)
  return (
    <svg width="100%" height="10" viewBox={`0 0 ${n * 6} 10`} preserveAspectRatio="none" aria-hidden="true" className={className}>
      <line x1="0" y1="9.5" x2={n * 6} y2="9.5" stroke="#e6d7bd" strokeWidth="1" />
      {Array.from({ length: grown }, (_, i) => (
        <circle
          key={i}
          cx={3 + i * 6}
          cy={7 - ((i * 7) % 3)}
          r={1.8 + ((i * 5) % 3) * 0.4}
          fill={i % 3 === 0 ? '#3f5631' : '#5d7a49'}
          className="animate-grow"
          style={{ transformOrigin: `${3 + i * 6}px 10px`, animationDelay: `${i * 55}ms` }}
        />
      ))}
    </svg>
  )
}
