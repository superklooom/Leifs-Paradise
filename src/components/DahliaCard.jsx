import Bloom from './Bloom'
import { getColorHex } from '../utils/colors'
import './DahliaCard.css'

export default function DahliaCard({ variety }) {
  const { name, dahliaNumber, height, colors, type, count } = variety
  const tint = getColorHex(colors[0])

  return (
    <article className="dahlia-card" style={{ '--tint': tint }}>
      <div className="dahlia-card__art">
        <Bloom colors={colors} size={112} />
        {dahliaNumber && <span className="dahlia-card__number">No. {dahliaNumber}</span>}
        <span className="dahlia-card__count" title={`${count} ${count === 1 ? 'tuber' : 'tubers'}`}>
          ×{count}
        </span>
      </div>

      <div className="dahlia-card__body">
        <h3 className="dahlia-card__name">{name}</h3>

        {colors.length > 0 && (
          <div className="dahlia-card__colors">
            {colors.map(c => (
              <span key={c} className="tag">
                <span className="dot" style={{ background: getColorHex(c) }} />
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="dahlia-card__meta">
          {type && <span className="dahlia-card__type">{type}</span>}
          {height ? (
            <span className="dahlia-card__height">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {height} cm
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}
