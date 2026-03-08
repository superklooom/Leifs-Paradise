import { useState } from 'react'
import './FilterBar.css'

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
  Bi: '#999',
}

function getColorHex(name) {
  // Try exact match first, then partial
  if (COLOR_HEX[name]) return COLOR_HEX[name]
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(COLOR_HEX)) {
    if (lower.includes(key.toLowerCase())) return val
  }
  return '#ccc'
}

export default function FilterBar({
  filters, onFilterChange,
  allColors, allTypes, heightRange,
  totalCount, filteredCount,
  view, onViewChange,
}) {
  const [heightMin, setHeightMin] = useState(heightRange.min)
  const [heightMax, setHeightMax] = useState(heightRange.max)

  // Sync slider with heightRange on first load
  const effectiveMin = filters.heightMin ?? heightRange.min
  const effectiveMax = filters.heightMax ?? heightRange.max

  function toggleColor(color) {
    const next = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color]
    onFilterChange({ colors: next })
  }

  function toggleType(type) {
    const next = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFilterChange({ types: next })
  }

  function clearAll() {
    onFilterChange({
      search: '',
      colors: [],
      types: [],
      heightMin: null,
      heightMax: null,
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.colors.length > 0 ||
    filters.types.length > 0 ||
    filters.heightMin !== null ||
    filters.heightMax !== null

  return (
    <div className="filter-bar">
      <div className="filter-bar__top">
        <div className="filter-bar__search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name…"
            value={filters.search}
            onChange={e => onFilterChange({ search: e.target.value })}
          />
          {filters.search && (
            <button className="clear-btn" onClick={() => onFilterChange({ search: '' })}>✕</button>
          )}
        </div>

        <div className="filter-bar__actions">
          {hasActiveFilters && (
            <button className="clear-all-btn" onClick={clearAll}>Clear filters</button>
          )}
          <div className="view-toggle">
            <button
              className={view === 'grid' ? 'active' : ''}
              onClick={() => onViewChange('grid')}
              title="Card view"
            >
              ⊞
            </button>
            <button
              className={view === 'table' ? 'active' : ''}
              onClick={() => onViewChange('table')}
              title="Table view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="filter-bar__filters">
        <div className="filter-group">
          <label>Color</label>
          <div className="color-chips">
            {allColors.map(color => (
              <button
                key={color}
                className={`color-chip ${filters.colors.includes(color) ? 'active' : ''}`}
                onClick={() => toggleColor(color)}
                title={color}
              >
                <span
                  className="color-dot"
                  style={{ background: getColorHex(color) }}
                />
                {color}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <div className="type-chips">
            {allTypes.map(type => (
              <button
                key={type}
                className={`type-chip ${filters.types.includes(type) ? 'active' : ''}`}
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group filter-group--height">
          <label>
            Height (cm)
            <span className="height-range-label">
              {effectiveMin}–{effectiveMax} cm
            </span>
          </label>
          <div className="height-sliders">
            <input
              type="range"
              min={heightRange.min}
              max={heightRange.max}
              value={effectiveMin}
              onChange={e => {
                const val = Number(e.target.value)
                onFilterChange({ heightMin: val <= heightRange.min ? null : val })
              }}
            />
            <input
              type="range"
              min={heightRange.min}
              max={heightRange.max}
              value={effectiveMax}
              onChange={e => {
                const val = Number(e.target.value)
                onFilterChange({ heightMax: val >= heightRange.max ? null : val })
              }}
            />
          </div>
        </div>
      </div>

      <div className="filter-bar__results">
        Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> varieties
        {hasActiveFilters && <span className="filtered-note"> (filtered)</span>}
      </div>
    </div>
  )
}
