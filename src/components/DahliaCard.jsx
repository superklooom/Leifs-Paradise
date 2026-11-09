import { useEffect, useRef, useState } from 'react'
import Bloom from './Bloom'
import { getColorHex } from '../utils/colors'
import './DahliaCard.css'

export default function DahliaCard({ variety, onSetStatus, onEdit }) {
  const { name, dahliaNumber, height, colors, type, count, deadCount, isLost } = variety
  const tint = isLost ? '#9a948c' : getColorHex(colors[0])
  const hasActions = Boolean(onSetStatus || onEdit)

  // On touch screens the actions (and the lost count) stay hidden until the picture is tapped.
  const [open, setOpen] = useState(false)
  const cardRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = e => { if (!cardRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  function toggleFromArt(e) {
    if (!hasActions || e.target.closest('button')) return
    setOpen(o => !o)
  }

  return (
    <article
      ref={cardRef}
      className={`dahlia-card ${isLost ? 'is-lost' : ''} ${open ? 'is-open' : ''}`}
      style={{ '--tint': tint }}
    >
      <div
        className={`dahlia-card__art ${hasActions ? 'is-tappable' : ''}`}
        onClick={toggleFromArt}
        role={hasActions ? 'button' : undefined}
        tabIndex={hasActions ? 0 : undefined}
        aria-expanded={hasActions ? open : undefined}
        aria-label={hasActions ? `${name}: show options` : undefined}
        onKeyDown={e => { if (hasActions && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); setOpen(o => !o) } }}
      >
        <Bloom colors={colors} type={type} size={112} className={isLost ? 'bloom--wilted' : ''} />
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

        {(onSetStatus || onEdit) && (
          <div className="dahlia-card__actions">
            {onEdit && (
              <button type="button" onClick={() => { setOpen(false); onEdit(variety) }} aria-label={`Edit ${name}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                Edit
              </button>
            )}
            {onSetStatus && count > 0 && (
              <button type="button" onClick={() => { setOpen(false); onSetStatus(variety, 'Dead') }}>Mark lost</button>
            )}
            {onSetStatus && deadCount > 0 && (
              <button type="button" onClick={() => { setOpen(false); onSetStatus(variety, 'Alive') }}>Revive</button>
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
