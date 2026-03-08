import { useState, useMemo } from 'react'
import { useDahlias } from './hooks/useDahlias'
import FilterBar from './components/FilterBar'
import DahliaCard from './components/DahliaCard'
import DahliaTable from './components/DahliaTable'
import './App.css'

export default function App() {
  const { varieties, loading, error, allColors, allTypes, heightRange } = useDahlias()

  const [view, setView] = useState('grid')
  const [filters, setFilters] = useState({
    search: '',
    colors: [],
    types: [],
    heightMin: null,
    heightMax: null,
  })
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  function handleSort(col) {
    if (sortKey === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(col)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const minH = filters.heightMin ?? heightRange.min
    const maxH = filters.heightMax ?? heightRange.max

    return varieties.filter(v => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!v.name.toLowerCase().includes(q)) return false
      }
      if (filters.colors.length > 0) {
        const hasColor = filters.colors.some(c => v.colors.includes(c))
        if (!hasColor) return false
      }
      if (filters.types.length > 0) {
        if (!filters.types.includes(v.type)) return false
      }
      if (v.height !== null) {
        if (v.height < minH || v.height > maxH) return false
      }
      return true
    })
  }, [varieties, filters, heightRange])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]
      if (sortKey === 'colors') {
        aVal = a.colors.join(', ')
        bVal = b.colors.join(', ')
      }
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      const cmp = typeof aVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // Summary stats
  const totalTubers = useMemo(() =>
    varieties.reduce((sum, v) => sum + v.count, 0), [varieties])

  const filteredTubers = useMemo(() =>
    filtered.reduce((sum, v) => sum + v.count, 0), [filtered])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__title">
            <span className="app-header__icon">🌸</span>
            <div>
              <h1>Dahlias Garden</h1>
              <p>{varieties.length} varieties · {totalTubers} tubers total</p>
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <div className="state-msg">
          <div className="spinner" />
          Loading your dahlias…
        </div>
      )}

      {error && (
        <div className="state-msg state-msg--error">
          Failed to load data: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            allColors={allColors}
            allTypes={allTypes}
            heightRange={heightRange}
            totalCount={varieties.length}
            filteredCount={filtered.length}
            view={view}
            onViewChange={setView}
          />

          <main className="app-main">
            {sorted.length === 0 ? (
              <div className="state-msg">
                No dahlias match the current filters.
              </div>
            ) : view === 'grid' ? (
              <>
                <div className="grid-summary">
                  {filtered.length} {filtered.length === 1 ? 'variety' : 'varieties'} · {filteredTubers} tubers
                </div>
                <div className="dahlia-grid">
                  {sorted.map(v => (
                    <DahliaCard key={v.name} variety={v} />
                  ))}
                </div>
              </>
            ) : (
              <DahliaTable
                varieties={sorted}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
            )}
          </main>
        </>
      )}
    </div>
  )
}
