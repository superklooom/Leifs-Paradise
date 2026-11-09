import { useState } from 'react'
import { getColorHex } from '../utils/colors'
import './FilterBar.css'

const EMPTY = { search: '', colors: [], types: [], heightMin: null, heightMax: null }

export default function FilterBar({
  filters, onFilterChange,
  allColors, allTypes, heightRange,
  totalCount, filteredCount, filteredTubers,
  view, onViewChange,
}) {
  const [open, setOpen] = useState(() =>
    typeof window === 'undefined' ? true : !window.matchMedia('(max-width: 720px)').matches)

  const effectiveMin = filters.heightMin ?? heightRange.min
  const effectiveMax = filters.heightMax ?? heightRange.max
  const span = Math.max(1, heightRange.max - heightRange.min)
  const pct = v => ((v - heightRange.min) / span) * 100

  function toggle(key, value) {
    const list = filters[key]
    onFilterChange({ [key]: list.includes(value) ? list.filter(x => x !== value) : [...list, value] })
  }

  const activeCount =
    filters.colors.length + filters.types.length +
    (filters.heightMin !== null || filters.heightMax !== null ? 1 : 0)
  const hasActiveFilters = Boolean(filters.search) || activeCount > 0

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__inner">
          <label className="search">
            <svg className="search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              type="search"
              placeholder="Search by name or number…"
              aria-label="Search dahlias"
              value={filters.search}
              onChange={e => onFilterChange({ search: e.target.value })}
            />
            {filters.search && (
              <button className="search__clear" onClick={() => onFilterChange({ search: '' })} aria-label="Clear search">✕</button>
            )}
          </label>

          <button
            className={`filters-btn ${open ? 'is-open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
            Filters
            {activeCount > 0 && <span className="filters-btn__badge">{activeCount}</span>}
          </button>

          <div className="toolbar__results">
            <strong>{filteredCount}</strong> of {totalCount} varieties · <strong>{filteredTubers}</strong> tubers
          </div>

          <div className="toolbar__actions">
            {hasActiveFilters && (
              <button className="link-btn" onClick={() => onFilterChange(EMPTY)}>Clear all</button>
            )}
            <div className="segmented" role="group" aria-label="View">
              <button className={view === 'grid' ? 'active' : ''} onClick={() => onViewChange('grid')} aria-pressed={view === 'grid'} title="Card view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                <span>Cards</span>
              </button>
              <button className={view === 'table' ? 'active' : ''} onClick={() => onViewChange('table')} aria-pressed={view === 'table'} title="Table view">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <section className="filters" aria-label="Filters">
          <div className="filters__inner">
            <div className="filter-group">
              <h4>Color</h4>
              <div className="chips">
                {allColors.map(color => (
                  <button
                    key={color}
                    className={`chip ${filters.colors.includes(color) ? 'active' : ''}`}
                    onClick={() => toggle('colors', color)}
                    aria-pressed={filters.colors.includes(color)}
                  >
                    <span className="dot" style={{ background: getColorHex(color) }} />
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Form</h4>
              <div className="chips">
                {allTypes.map(type => (
                  <button
                    key={type}
                    className={`chip ${filters.types.includes(type) ? 'active' : ''}`}
                    onClick={() => toggle('types', type)}
                    aria-pressed={filters.types.includes(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group filter-group--height">
              <h4>
                Height
                <span className="height-value">{effectiveMin}–{effectiveMax} cm</span>
              </h4>
              <div
                className="range"
                style={{ '--lo': `${pct(effectiveMin)}%`, '--hi': `${pct(effectiveMax)}%` }}
              >
                <div className="range__track" />
                <input
                  type="range"
                  aria-label="Minimum height"
                  min={heightRange.min}
                  max={heightRange.max}
                  value={effectiveMin}
                  onChange={e => {
                    const val = Math.min(Number(e.target.value), effectiveMax)
                    onFilterChange({ heightMin: val <= heightRange.min ? null : val })
                  }}
                />
                <input
                  type="range"
                  aria-label="Maximum height"
                  min={heightRange.min}
                  max={heightRange.max}
                  value={effectiveMax}
                  onChange={e => {
                    const val = Math.max(Number(e.target.value), effectiveMin)
                    onFilterChange({ heightMax: val >= heightRange.max ? null : val })
                  }}
                />
              </div>
              <div className="range__scale"><span>{heightRange.min}</span><span>{heightRange.max} cm</span></div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
