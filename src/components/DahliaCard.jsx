import './DahliaCard.css'

const COLOR_HEX = {
  Red: '#c0392b',
  Pink: '#e91e8c',
  Orange: '#e67e22',
  Yellow: '#f1c40f',
  White: '#f0ece4',
  Purple: '#8e44ad',
  Lavender: '#c39bd3',
  Burgundy: '#6c1f2e',
  Salmon: '#fa8072',
  Coral: '#ff6b6b',
  Peach: '#ffcba4',
  Cream: '#fff8dc',
  Violet: '#7f00ff',
  Lilac: '#c8a2c8',
  Magenta: '#c2185b',
  'Dark Red': '#8b0000',
  'Dark Pink': '#e75480',
}

function getColorHex(name) {
  if (COLOR_HEX[name]) return COLOR_HEX[name]
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(COLOR_HEX)) {
    if (lower.includes(key.toLowerCase())) return val
  }
  return '#ccc'
}

function colorStrip(colors) {
  if (colors.length === 1) return getColorHex(colors[0])
  const stops = colors.map((c, i) => {
    const pct = Math.round((i / (colors.length - 1)) * 100)
    return `${getColorHex(c)} ${pct}%`
  })
  return `linear-gradient(135deg, ${stops.join(', ')})`
}

export default function DahliaCard({ variety }) {
  const { name, dahliaNumber, height, colors, type, count } = variety
  const bg = colorStrip(colors.length > 0 ? colors : ['#ccc'])

  return (
    <div className="dahlia-card">
      <div className="dahlia-card__swatch" style={{ background: bg }} />
      <div className="dahlia-card__body">
        <div className="dahlia-card__header">
          <div>
            <h3 className="dahlia-card__name">{name}</h3>
            {dahliaNumber && (
              <span className="dahlia-card__number">#{dahliaNumber}</span>
            )}
          </div>
          <span className="dahlia-card__count" title="Number of tubers">
            ×{count}
          </span>
        </div>
        <div className="dahlia-card__colors">
          {colors.map(c => (
            <span key={c} className="dahlia-card__color-tag">
              <span
                className="dahlia-card__color-dot"
                style={{ background: getColorHex(c) }}
              />
              {c}
            </span>
          ))}
        </div>
        <div className="dahlia-card__meta">
          {type && <span className="dahlia-card__type">{type}</span>}
          {height && (
            <span className="dahlia-card__height">
              <span className="meta-icon">↕</span> {height} cm
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
