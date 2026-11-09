import Bloom from './Bloom'
import { getColorHex } from '../utils/colors'
import './DahliaCard.css'

export default function DahliaCard({ variety, onSetStatus }) {
  const { name, dahliaNumber, height, colors, type, count, deadCount, isLost } = variety
  const tint = isLost ? '#9a948c' : getColorHex(colors[0])

  return (
    <article className={`dahlia-card ${isLost ? 'is-lost' : ''}`} style={{ '--tint': tint }}>
      <div className="dahlia-card__art">
        <Bloom colors={colors} size={112} className={isLost ? 'bloom--wilted' : ''} />
        {dahliaNumber && <span className="dahlia-card__number">No. {dahliaNumber}</span>}
        {isLost ? (
          <span className="dahlia-card__lost-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/><path d="M12 6l-1.5 5 3 2-1.5 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Lost · {deadCount}
          </span>
        ) : (
          <span className="dahlia-card__badges">
            <span className="dahlia-card__count" title={`${count} living ${count === 1 ? 'tuber' : 'tubers'}`}>
              ×{count}
            </span>
            {deadCount > 0 && (
              <span className="dahlia-card__dead" title={`${deadCount} lost ${deadCount === 1 ? 'tuber' : 'tubers'}`}>
                +{deadCount} lost
              </span>
            )}
          </span>
        )}

        {onSetStatus && (
          <div className="dahlia-card__actions">
            {count > 0 && (
              <button type="button" onClick={() => onSetStatus(variety, 'Dead')}>Mark lost</button>
            )}
            {deadCount > 0 && (
              <button type="button" onClick={() => onSetStatus(variety, 'Alive')}>Revive</button>
            )}
          </div>
        )}
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
