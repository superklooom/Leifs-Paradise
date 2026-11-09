import { useId } from 'react'
import { getColorHex } from '../utils/colors'

/* ------------------------------------------------------------------ *
 * A stylised dahlia drawn in the variety's own colors, shaped by its
 * form (Type column): decorative, ball, pompom, cactus, waterlily…
 * Petals point "up" from the origin; the view box is -50..50.
 * ------------------------------------------------------------------ */

// ---- petal outlines (base at 0,0, tip at 0,-L) ----
const SHAPES = {
  // broad, pointed tip — decorative
  pointed: (L, W) =>
    `M0,0 C${W},${-L * 0.25} ${W * 0.9},${-L * 0.8} 0,${-L} C${-W * 0.9},${-L * 0.8} ${-W},${-L * 0.25} 0,0 Z`,
  // broad, rounded tip — waterlily, peony, single, ball
  round: (L, W) =>
    `M0,0 C${W},${-L * 0.15} ${W * 1.05},${-L * 0.7} ${W * 0.6},${-L * 0.92} Q0,${-L * 1.04} ${-W * 0.6},${-L * 0.92} C${-W * 1.05},${-L * 0.7} ${-W},${-L * 0.15} 0,0 Z`,
  // narrow rolled quill — cactus
  quill: (L, W) =>
    `M0,0 C${W},${-L * 0.3} ${W * 0.7},${-L * 0.75} 0,${-L} C${-W * 0.7},${-L * 0.75} ${-W},${-L * 0.3} 0,0 Z`,
  // wide base, rolled narrow tip — semi-cactus
  semi: (L, W) =>
    `M0,0 C${W},${-L * 0.2} ${W * 0.8},${-L * 0.55} ${W * 0.25},${-L * 0.85} L0,${-L} L${-W * 0.25},${-L * 0.85} C${-W * 0.8},${-L * 0.55} ${-W},${-L * 0.2} 0,0 Z`,
  // split / fringed tip — fimbriata
  split: (L, W) =>
    `M0,0 C${W},${-L * 0.2} ${W * 0.95},${-L * 0.62} ${W * 0.5},${-L} L${W * 0.12},${-L * 0.86} L0,${-L * 0.97} L${-W * 0.12},${-L * 0.86} L${-W * 0.5},${-L} C${-W * 0.95},${-L * 0.62} ${-W},${-L * 0.2} 0,0 Z`,
}

// Detail line drawn on top of each petal (vein, rolled edge or cup highlight).
const DETAIL = {
  pointed: (L) => ({ d: `M0,${-L * 0.18} L0,${-L * 0.82}`, stroke: 'rgba(0,0,0,0.12)', w: 0.7 }),
  round: (L) => ({ d: `M0,${-L * 0.2} L0,${-L * 0.75}`, stroke: 'rgba(0,0,0,0.08)', w: 0.6 }),
  cup: (L, W) => ({ d: `M${-W * 0.45},${-L * 0.82} Q0,${-L * 0.7} ${W * 0.45},${-L * 0.82}`, stroke: 'rgba(255,255,255,0.3)', w: 0.8 }),
  quill: (L) => ({ d: `M0,${-L * 0.1} L0,${-L * 0.9}`, stroke: 'rgba(255,255,255,0.35)', w: 0.8 }),
  semi: (L) => ({ d: `M0,${-L * 0.15} L0,${-L * 0.9}`, stroke: 'rgba(0,0,0,0.12)', w: 0.7 }),
  split: (L) => ({ d: `M0,${-L * 0.15} L0,${-L * 0.8}`, stroke: 'rgba(0,0,0,0.12)', w: 0.7 }),
}

// ---- forms ----
// ring: n petals, length L, width W, rotation offset, shape, optional jitter / color role
const FORMS = {
  decorative: {
    rings: [
      { n: 16, L: 46, W: 11, offset: 0 },
      { n: 14, L: 37, W: 10, offset: 12.8 },
      { n: 12, L: 28, W: 8.5, offset: 5 },
      { n: 10, L: 19, W: 6.5, offset: 18 },
      { n: 7, L: 10, W: 4, offset: 9 },
    ].map(r => ({ ...r, shape: 'pointed' })),
    center: 'double',
  },
  dinnerplate: {
    rings: [
      { n: 18, L: 48, W: 12.5, offset: 0 },
      { n: 16, L: 40, W: 11.5, offset: 11 },
      { n: 14, L: 31, W: 10, offset: 4 },
      { n: 11, L: 22, W: 8, offset: 16 },
      { n: 8, L: 13, W: 5.5, offset: 7 },
    ].map(r => ({ ...r, shape: 'pointed' })),
    center: 'double',
  },
  informal: {
    rings: [
      { n: 15, L: 46, W: 11 },
      { n: 13, L: 37, W: 10, offset: 14 },
      { n: 11, L: 28, W: 8.5, offset: 6 },
      { n: 9, L: 18, W: 6.5, offset: 20 },
      { n: 6, L: 10, W: 4, offset: 10 },
    ].map(r => ({ offset: 0, ...r, shape: 'pointed', jitter: 14 })),
    center: 'double',
  },
  ball: {
    rings: [
      { n: 14, L: 44, W: 12.5, offset: 0 },
      { n: 13, L: 37, W: 11.5, offset: 13 },
      { n: 12, L: 30, W: 10.5, offset: 4 },
      { n: 10, L: 23, W: 9, offset: 17 },
      { n: 8, L: 16, W: 7.5, offset: 8 },
      { n: 6, L: 9, W: 5.5, offset: 25 },
    ].map(r => ({ ...r, shape: 'round', detail: 'cup' })),
    center: 'double',
  },
  pompom: { pompom: true, scale: 0.86 },
  cactus: {
    rings: [
      { n: 20, L: 47, W: 3.6, offset: 0 },
      { n: 18, L: 40, W: 3.4, offset: 9 },
      { n: 15, L: 31, W: 3.1, offset: 4 },
      { n: 12, L: 22, W: 2.7, offset: 15 },
      { n: 8, L: 12, W: 2.2, offset: 7 },
    ].map(r => ({ ...r, shape: 'quill' })),
    center: 'double',
  },
  semicactus: {
    rings: [
      { n: 17, L: 47, W: 7, offset: 0 },
      { n: 15, L: 39, W: 6.5, offset: 11 },
      { n: 13, L: 30, W: 5.8, offset: 4 },
      { n: 10, L: 21, W: 4.8, offset: 16 },
      { n: 7, L: 11, W: 3.4, offset: 8 },
    ].map(r => ({ ...r, shape: 'semi' })),
    center: 'double',
  },
  fimbriata: {
    rings: [
      { n: 16, L: 47, W: 8.5, offset: 0 },
      { n: 14, L: 39, W: 7.8, offset: 12 },
      { n: 12, L: 30, W: 6.8, offset: 4 },
      { n: 10, L: 21, W: 5.5, offset: 17 },
      { n: 7, L: 11, W: 3.6, offset: 8 },
    ].map(r => ({ ...r, shape: 'split' })),
    center: 'double',
  },
  stellar: {
    rings: [
      { n: 14, L: 47, W: 4.6, offset: 0 },
      { n: 12, L: 37, W: 4.2, offset: 14 },
      { n: 10, L: 26, W: 3.6, offset: 5 },
      { n: 8, L: 15, W: 2.8, offset: 20 },
    ].map(r => ({ ...r, shape: 'quill' })),
    center: 'disc', centerR: 5,
  },
  waterlily: {
    rings: [
      { n: 10, L: 46, W: 15, offset: 0 },
      { n: 9, L: 38, W: 13, offset: 20 },
      { n: 8, L: 28, W: 11, offset: 8 },
      { n: 6, L: 18, W: 8, offset: 30 },
    ].map(r => ({ ...r, shape: 'round' })),
    center: 'disc', centerR: 5,
  },
  peony: {
    rings: [
      { n: 10, L: 46, W: 15, offset: 0, shape: 'round' },
      { n: 9, L: 36, W: 12, offset: 18, shape: 'round' },
      { n: 8, L: 23, W: 7, offset: 6, shape: 'pointed', jitter: 18 },
    ],
    center: 'disc', centerR: 9,
  },
  single: {
    rings: [{ n: 8, L: 46, W: 17, offset: 0, shape: 'round' }],
    center: 'disc', centerR: 12,
  },
  orchid: {
    rings: [{ n: 8, L: 46, W: 6.5, offset: 0, shape: 'quill' }],
    center: 'disc', centerR: 8,
  },
  anemone: {
    rings: [
      { n: 10, L: 46, W: 13, offset: 0, shape: 'round' },
      { n: 8, L: 40, W: 12, offset: 22, shape: 'round' },
    ],
    center: 'cushion', centerR: 21,
  },
  collarette: {
    rings: [
      { n: 8, L: 46, W: 17, offset: 0, shape: 'round' },
      { n: 12, L: 24, W: 5, offset: 15, shape: 'pointed', role: 'collar' },
    ],
    center: 'disc', centerR: 8,
  },
}

/** Map the sheet's Type text (any language/spelling) to a drawing. Order matters: specific first. */
export function bloomForm(type) {
  const t = String(type || '').toLowerCase()
  if (/pom ?po[mn]/.test(t)) return 'pompom'
  if (/fimbri|laciniat|fringe/.test(t)) return 'fimbriata'
  if (/semi.?cact/.test(t)) return 'semicactus'
  if (/cact/.test(t)) return 'cactus'
  if (/stellar/.test(t)) return 'stellar'
  if (/anemon/.test(t)) return 'anemone'
  if (/collar/.test(t)) return 'collarette'
  if (/orchid|star/.test(t)) return 'orchid'
  if (/single|mignon|simple/.test(t)) return 'single'
  if (/peon/.test(t)) return 'peony'
  if (/water ?lil|nymph/.test(t)) return 'waterlily'
  if (/ball/.test(t)) return 'ball'
  if (/dinner|giant/.test(t)) return 'dinnerplate'
  if (/informal/.test(t)) return 'informal'
  return 'decorative' // decorative / dekorativ / unknown
}

function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

// Deterministic "random" in [-1, 1] so a flower always looks the same.
const wobble = (i, j) => Math.sin(i * 12.9898 + j * 78.233) * 0.5 + Math.sin(i * 4.1 + j * 1.7) * 0.5

function Petals({ ring, ri, fill, shadeId }) {
  const d = SHAPES[ring.shape](ring.L, ring.W)
  const det = DETAIL[ring.detail || ring.shape](ring.L, ring.W)
  return (
    <g>
      {Array.from({ length: ring.n }, (_, i) => {
        const angle = ring.offset + (360 / ring.n) * i + (ring.jitter ? wobble(i, ri) * ring.jitter : 0)
        const scale = ring.jitter ? 1 + wobble(ri, i) * 0.08 : 1
        return (
          <g key={i} transform={`rotate(${angle}) scale(${scale})`}>
            <path d={d} fill={fill} stroke="rgba(0,0,0,0.14)" strokeWidth="0.6" />
            <path d={d} fill={`url(#${shadeId})`} />
            <path d={det.d} stroke={det.stroke} strokeWidth={det.w} fill="none" strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
}

function Pompom({ hexes, shadeId }) {
  // Rings of round, cupped florets (honeycomb look); outer rings first so inner ones sit on top.
  const rings = [
    { r: 38, n: 19, s: 7.6 },
    { r: 31, n: 16, s: 7 },
    { r: 24, n: 13, s: 6.3 },
    { r: 17, n: 10, s: 5.5 },
    { r: 10, n: 6, s: 4.6 },
    { r: 0, n: 1, s: 4.2 },
  ]
  const base = (
    <g key="base">
      <circle r="40" fill={hexes[0]} />
      <circle r="40" fill={`url(#${shadeId})`} />
      <circle r="40" fill="rgba(0,0,0,0.18)" />
    </g>
  )
  return [base, ...rings.map((ring, ri) => {
    const fill = hexes[Math.min(hexes.length - 1, Math.floor((ri * hexes.length) / rings.length))]
    return (
      <g key={ri}>
        {Array.from({ length: ring.n }, (_, i) => {
          const a = ((360 / ring.n) * i + ri * 11) * (Math.PI / 180)
          const x = Math.sin(a) * ring.r
          const y = -Math.cos(a) * ring.r
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={ring.s} fill={fill} stroke="rgba(0,0,0,0.16)" strokeWidth="0.6" />
              <circle cx={x} cy={y} r={ring.s} fill={`url(#${shadeId})`} />
              <circle cx={x} cy={y} r={ring.s * 0.45} fill="rgba(0,0,0,0.12)" />
            </g>
          )
        })}
      </g>
    )
  })]
}

function Disc({ r, shadeId }) {
  const dots = Math.max(6, Math.round(r * 1.6))
  return (
    <g>
      <circle r={r} fill="#e2b33b" />
      <circle r={r} fill={`url(#${shadeId})`} />
      {Array.from({ length: dots }, (_, i) => {
        const a = (i * 137.5) * (Math.PI / 180)
        const rr = Math.sqrt((i + 0.5) / dots) * r * 0.82
        return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={Math.max(0.6, r * 0.07)} fill="#9a6b12" opacity="0.55" />
      })}
    </g>
  )
}

function Cushion({ r, fill, shadeId }) {
  // Anemone centre: a dense pincushion of short tubular florets.
  const florets = 46
  return (
    <g>
      <circle r={r} fill={fill} stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
      {Array.from({ length: florets }, (_, i) => {
        const a = (i * 137.5) * (Math.PI / 180)
        const rr = Math.sqrt((i + 0.5) / florets) * r * 0.9
        return (
          <g key={i}>
            <circle cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={2.3} fill={fill} stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
            <circle cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={0.8} fill="#e2b33b" opacity="0.85" />
          </g>
        )
      })}
      <circle r={r} fill={`url(#${shadeId})`} />
    </g>
  )
}

export default function Bloom({ colors = [], type, size = 120, className = '' }) {
  const id = useId().replace(/:/g, '')
  const shadeId = `shade-${id}`
  const hexes = (colors.length ? colors : [null]).map(c => getColorHex(c))
  const kind = bloomForm(type)
  const form = FORMS[kind]

  // Petal rings move through the colors from outside in, so "Pink, White" reads as pink with a white heart.
  // Collar petals and anemone cushions use the second color when there is one.
  const petalRings = form.rings ? form.rings.filter(r => r.role !== 'collar') : []
  // Anemone and collarette show their second color in the centre, so their ray petals keep the first.
  const accentCentre = form.center === 'cushion' || form.rings?.some(r => r.role === 'collar')
  const ringColor = ri => accentCentre
    ? hexes[0]
    : hexes[Math.min(hexes.length - 1, Math.floor((ri * hexes.length) / Math.max(1, petalRings.length)))]
  const accent = hexes[1] ?? (kind === 'collarette' ? '#f4efe6' : mixHex(hexes[0], '#e2b33b', 0.45))

  return (
    <svg
      className={`bloom bloom--${kind} ${className}`}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={shadeId} cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.18" />
        </radialGradient>
      </defs>

      <g transform={form.scale ? `scale(${form.scale})` : undefined}>
        {form.pompom ? (
          <Pompom hexes={hexes} shadeId={shadeId} />
        ) : (
          form.rings.map((ring, ri) => (
            <Petals
              key={ri}
              ring={ring}
              ri={ri}
              fill={ring.role === 'collar' ? accent : ringColor(petalRings.indexOf(ring))}
              shadeId={shadeId}
            />
          ))
        )}

        {form.center === 'double' && (
          <>
            <circle r="3" fill={hexes[hexes.length - 1]} />
            <circle r="3" fill={`url(#${shadeId})`} />
          </>
        )}
        {form.center === 'disc' && <Disc r={form.centerR} shadeId={shadeId} />}
        {form.center === 'cushion' && <Cushion r={form.centerR} fill={accent} shadeId={shadeId} />}
      </g>
    </svg>
  )
}
