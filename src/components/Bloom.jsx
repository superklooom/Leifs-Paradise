import { useId } from 'react'
import { getColorHex } from '../utils/colors'

// Petal pointing up from the origin, length L, width W.
function petalPath(L, W) {
  return `M0,0 C${W},${-L * 0.25} ${W * 0.9},${-L * 0.8} 0,${-L} C${-W * 0.9},${-L * 0.8} ${-W},${-L * 0.25} 0,0 Z`
}

const RINGS = [
  { n: 16, L: 46, W: 11, offset: 0 },
  { n: 14, L: 36, W: 10, offset: 12.8 },
  { n: 11, L: 25, W: 8.5, offset: 5 },
  { n: 8, L: 15, W: 6, offset: 20 },
]

/** A stylised dahlia drawn in the variety's own colors. */
export default function Bloom({ colors = [], size = 120, className = '' }) {
  const id = useId().replace(/:/g, '')
  const hexes = (colors.length ? colors : [null]).map(c => getColorHex(c))

  // Outer rings take the first color, inner rings move through the rest —
  // so a "Pink, White" variety reads as pink with a white heart.
  const ringColor = i => hexes[Math.min(hexes.length - 1, Math.floor((i * hexes.length) / RINGS.length))]

  return (
    <svg
      className={`bloom ${className}`}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`shade-${id}`} cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      {RINGS.map((ring, ri) => {
        const d = petalPath(ring.L, ring.W)
        const fill = ringColor(ri)
        return (
          <g key={ri}>
            {Array.from({ length: ring.n }, (_, i) => (
              <g key={i} transform={`rotate(${ring.offset + (360 / ring.n) * i})`}>
                <path d={d} fill={fill} stroke="rgba(0,0,0,0.14)" strokeWidth="0.6" />
                <path d={d} fill={`url(#shade-${id})`} />
                <path d={`M0,${-ring.L * 0.18} L0,${-ring.L * 0.82}`} stroke="rgba(0,0,0,0.12)" strokeWidth="0.7" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )
      })}
      <circle r="6" fill="#e2b33b" />
      <circle r="6" fill={`url(#shade-${id})`} />
      <circle r="2.4" fill="#9a6b12" opacity="0.6" />
    </svg>
  )
}
