import { useId, useMemo } from 'react'

/**
 * Moss is the brand's sign of life and it means one thing: a need has been met.
 *
 * Drawn the way a cushion of moss really grows: hundreds of short curved shoots fanning outward from the
 * centre of a mound, darker at the base and brighter at the crown, with halftone shading on the shadow
 * side and a hairline broken outline (brand references 03 and 04). Sporophytes are a slender curved seta
 * topped with a small capsule and a pale cap.
 *
 * Four states follow the project's data, never taste:
 *   dormant  flat grey, still               (Closed, Unavailable, Declined)
 *   open     sparse, tipped in terracotta   (Seeking support, Missing, Partially funded)
 *   growing  medium moss                    (Running, In progress, Contacted, Requested, Saved)
 *   secured  dense, moss-300 new growth     (Secured, Accepted, Done, Supporting)
 *
 * Growth runs outward from the base in steps of 610ms, one layer at a time, and never loops. Under
 * prefers-reduced-motion it becomes an instant change. Positions come from a seeded generator, so a given
 * card always draws the same moss.
 */
export type MossState = 'dormant' | 'open' | 'growing' | 'secured'

const C = {
  shade: '#3f5631', // moss-700
  body: '#5d7a49', // moss-500
  tip: '#a3c08c', // moss-300
  terra: '#c4663d', // terra-500
  grey: '#4b5563', // gray-600
  greyLt: '#9ca3af', // gray-400
  line: '#e6d7bd', // cloth-200
}

// Shoots per square pixel of the frame.
const RATE: Record<MossState, number> = { dormant: 0.006, open: 0.012, growing: 0.022, secured: 0.036 }

// Small seeded generator (mulberry32).
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

const n1 = (v: number) => v.toFixed(1)

interface Shoot {
  d: string
  sw: number
  col: string
  layer: number
  y: number
  tip?: { x: number; y: number; r: number; col: string }
}

interface Cushion {
  w: number
  h: number
  silhouette: string
  shoots: Shoot[]
  halftone: { x: number; y: number; r: number }[]
}

export function buildCushion(state: MossState, w: number, h: number, seed: number): Cushion {
  const rand = rng(seed)
  const cx = w / 2
  const rx = w / 2 - 3
  const ry = h - 5
  const baseY = h - 1
  const s = Math.max(0.5, Math.min(1.6, w / 144))

  // An irregular dome: the edge of a cushion is never a clean ellipse.
  const pts: string[] = []
  const N = 56
  for (let i = 0; i <= N; i++) {
    const a = Math.PI - (Math.PI * i) / N
    const wob = 1 + (rand() - 0.5) * 0.07
    pts.push(`${i === 0 ? 'M' : 'L'}${n1(cx + Math.cos(a) * rx * wob)} ${n1(baseY - Math.sin(a) * ry * wob)}`)
  }

  const shoots: Shoot[] = []
  const count = Math.max(24, Math.round(RATE[state] * w * h))
  for (let i = 0; i < count; i++) {
    const a = Math.PI * (0.03 + 0.94 * rand())
    const d = Math.sqrt(rand())
    const x = cx + Math.cos(a) * d * rx * 0.97
    const y = baseY - Math.sin(a) * d * ry * 0.97
    const lift = Math.max(0, Math.min(1, (baseY - y) / ry)) // 0 at the base, 1 at the crown
    // Shoots fan outward from a point below the mound, the way a cushion's surface grows.
    const out = Math.atan2(y - (baseY + ry * 0.5), x - cx) + (rand() - 0.5) * 0.7
    const L = (4 + rand() * 5) * s
    const tx = x + Math.cos(out) * L
    const ty = Math.min(y + Math.sin(out) * L, baseY - 0.5)
    const bend = (rand() - 0.5) * L * 0.6
    const mx = (x + tx) / 2 - Math.sin(out) * bend
    const my = (y + ty) / 2 + Math.cos(out) * bend

    let col: string
    let showTip = false
    if (state === 'dormant') {
      col = rand() > 0.5 ? C.grey : C.greyLt
    } else if (state === 'open') {
      col = lift > 0.55 && rand() > 0.5 ? C.terra : rand() > 0.5 ? C.body : C.shade
      showTip = col === C.terra
    } else if (state === 'secured') {
      const fresh = lift > 0.66 && rand() > 0.32
      col = fresh ? C.tip : rand() > 0.5 ? C.body : C.shade
      showTip = fresh
    } else {
      col = rand() > 0.5 ? C.body : C.shade
    }
    shoots.push({
      d: `M${n1(x)} ${n1(y)} Q${n1(mx)} ${n1(my)} ${n1(tx)} ${n1(ty)}`,
      sw: Math.max(0.55, (0.8 + rand() * 0.7) * Math.min(1, s)),
      col,
      layer: Math.min(2, Math.floor(lift * 3)),
      y,
      tip: showTip ? { x: tx, y: ty, r: Math.max(0.5, (0.7 + rand() * 0.6) * Math.min(1, s)), col } : undefined,
    })
  }
  shoots.sort((p, q) => p.y - q.y) // upper shoots first, so lower ones overlap them

  // Halftone shading: dots swell toward the shadow side (bottom right), like a printed plate.
  const halftone: { x: number; y: number; r: number }[] = []
  if (state !== 'dormant') {
    const sp = 4.2 * Math.max(0.8, s)
    for (let gy = sp / 2; gy < baseY; gy += sp) {
      for (let gx = sp / 2; gx < w; gx += sp) {
        const ex = (gx - cx) / rx
        const ey = (baseY - gy) / ry
        if (ex * ex + ey * ey > 0.9) continue
        const t = 0.6 * (gx / w) + 0.4 * (gy / baseY)
        if (t < 0.52) continue
        const r = Math.min(1.5 * s, (t - 0.5) * 3.4 * s)
        if (r > 0.35) halftone.push({ x: gx, y: gy, r })
      }
    }
  }
  return { w, h, silhouette: `${pts.join(' ')} Z`, shoots, halftone }
}

function CushionShapes({ cu, state, animate, delay = 0 }: { cu: Cushion; state: MossState; animate: boolean; delay?: number }) {
  const { w, h } = cu
  const baseFill = state === 'dormant' ? C.greyLt : state === 'open' ? C.body : C.shade
  const baseOpacity = state === 'dormant' ? 0.25 : state === 'open' ? 0.35 : 0.9
  return (
    <>
      <path d={cu.silhouette} fill={baseFill} opacity={baseOpacity} />
      {[2, 1, 0].map((layer) => (
        <g
          key={layer}
          className={animate ? 'animate-grow' : undefined}
          style={animate ? { transformOrigin: `${w / 2}px ${h}px`, animationDelay: `${delay + layer * 610}ms` } : undefined}
        >
          {cu.shoots
            .filter((sh) => sh.layer === layer)
            .map((sh, i) => (
              <g key={i}>
                <path d={sh.d} stroke={sh.col} strokeWidth={sh.sw} fill="none" strokeLinecap="round" />
                {sh.tip && <circle cx={sh.tip.x} cy={sh.tip.y} r={sh.tip.r} fill={sh.tip.col} />}
              </g>
            ))}
        </g>
      ))}
      {cu.halftone.length > 0 && (
        <g fill={C.shade} opacity="0.5">
          {cu.halftone.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
        </g>
      )}
      {w >= 100 && state !== 'dormant' && (
        <path d={cu.silhouette} fill="none" stroke={C.shade} strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="6 2 1 2" strokeLinecap="round" />
      )}
    </>
  )
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
  const cu = useMemo(() => buildCushion(state, width, height, seed), [state, width, height, seed])
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
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke={C.line} strokeWidth="1" />
      <CushionShapes cu={cu} state={state} animate={state !== 'dormant'} />
    </svg>
  )
}

/** A sporophyte: a slender curved seta that draws upward from the moss, topped with a capsule and a pale cap. */
function Sporo({ x, y, h, lean, delay }: { x: number; y: number; h: number; lean: number; delay: number }) {
  const tx = x + lean
  const ty = y - h
  const d = `M${n1(x)} ${n1(y)} C${n1(x + lean * 0.1)} ${n1(y - h * 0.45)} ${n1(x + lean * 0.95)} ${n1(y - h * 0.65)} ${n1(tx)} ${n1(ty)}`
  const tilt = (Math.atan2(lean, h) * 180) / Math.PI
  return (
    <g>
      <path d={d} pathLength={1} className="animate-draw" style={{ animationDelay: `${delay}ms` }} fill="none" stroke={C.body} strokeWidth="1.4" strokeLinecap="round" />
      <g className="animate-fade" style={{ animationDelay: `${delay + 610}ms` }} transform={`rotate(${n1(tilt)} ${n1(tx)} ${n1(ty)})`}>
        <ellipse cx={n1(tx)} cy={n1(ty - 4.6)} rx="3" ry="5" fill={C.shade} />
        <path d={`M${n1(tx - 1.6)} ${n1(ty - 7.4)} Q${n1(tx - 2.5)} ${n1(ty - 4.6)} ${n1(tx - 1.6)} ${n1(ty - 1.8)}`} stroke={C.tip} strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <ellipse cx={n1(tx)} cy={n1(ty - 9.2)} rx="2.1" ry="1.5" fill={C.tip} />
      </g>
    </g>
  )
}

/** One secured resource: a sporophyte rising from a tuft of moss. */
export function Sporophyte({ height = 34, className = '' }: { height?: number; className?: string }) {
  const w = 21
  const H = Math.max(34, height)
  const r = rng(3)
  const tuft = Array.from({ length: 9 }, (_, i) => {
    const x = 10.5 + (i - 4) * 1.7 + (r() - 0.5)
    const lean = (i - 4) * 0.9
    return `M${n1(x)} ${H - 1} Q${n1(x + lean * 0.4)} ${n1(H - 4)} ${n1(x + lean)} ${n1(H - 6 - r() * 2)}`
  })
  return (
    <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} aria-hidden="true" className={className}>
      <line x1="0" y1={H - 0.5} x2={w} y2={H - 0.5} stroke={C.line} strokeWidth="1" />
      {tuft.map((d, i) => <path key={i} d={d} stroke={i % 2 ? C.body : C.shade} strokeWidth="1" fill="none" strokeLinecap="round" />)}
      <Sporo x={10.5} y={H - 3} h={H - 17} lean={2.5} delay={0} />
    </svg>
  )
}

/**
 * Hero art: one cushion with three sporophytes, resting on the band's lower edge. 233 x 144 is a
 * golden (13:8-ish) frame. Grain sits over it at 0.08 (the brand's grain-opacity).
 * Sequence: cushion layers grow base to crown (610ms steps), then the three stalks draw, 55ms apart.
 */
export function HeroMoss({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const W = 233
  const H = 144
  const CH = 89
  const cu = useMemo(() => buildCushion('secured', W, CH, 13), [])
  const spores = useMemo(() => {
    const r = rng(41)
    return Array.from({ length: 16 }, () => ({ x: 4 + r() * (W - 8), r: 0.5 + r() * 0.7, c: r() > 0.5 ? C.body : C.tip }))
  }, [])
  const base = H - 20
  const stalks: [number, number, number][] = [[80, 54, 7], [121, 37, -5], [156, 46, 9]] // x, height, lean
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={className} preserveAspectRatio="xMidYMax meet">
      <defs>
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke={C.line} strokeWidth="1" />
      {spores.map((p, i) => <circle key={i} cx={p.x} cy={H - 2.2 - ((i * 7) % 3)} r={p.r} fill={p.c} />)}
      <g transform={`translate(0 ${H - CH})`}>
        <CushionShapes cu={cu} state="secured" animate />
      </g>
      {stalks.map(([x, h, lean], i) => <Sporo key={i} x={x} y={base} h={h} lean={lean} delay={1830 + i * 55} />)}
      <rect width={W} height={H} filter={`url(#grain-${id})`} opacity="0.08" style={{ mixBlendMode: 'multiply' }} pointerEvents="none" />
    </svg>
  )
}

/** A growing line of moss along a base. `share` is how much of it has been secured (0 to 1). */
export function CarpetEdge({ share, className = '' }: { share: number; className?: string }) {
  const n = 48
  const grown = Math.round(Math.max(0, Math.min(1, share)) * n)
  const shoots = useMemo(() => {
    const r = rng(11)
    return Array.from({ length: n }, (_, i) => {
      const x = 3 + i * 6
      const h = 4 + r() * 5
      const lean = (r() - 0.5) * 3
      return { x, d: `M${n1(x)} 9.5 Q${n1(x + lean)} ${n1(9.5 - h / 2)} ${n1(x + lean * 1.4)} ${n1(9.5 - h)}`, col: i % 3 === 0 ? C.shade : C.body }
    })
  }, [])
  return (
    <svg width="100%" height="10" viewBox={`0 0 ${n * 6} 10`} preserveAspectRatio="none" aria-hidden="true" className={className}>
      <line x1="0" y1="9.5" x2={n * 6} y2="9.5" stroke={C.line} strokeWidth="1" />
      {shoots.slice(0, grown).map((sh, i) => (
        <path
          key={i}
          d={sh.d}
          stroke={sh.col}
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="animate-grow"
          style={{ transformOrigin: `${sh.x}px 10px`, animationDelay: `${i * 55}ms` }}
        />
      ))}
    </svg>
  )
}
