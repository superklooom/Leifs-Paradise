import { useState, useMemo } from 'react'
import { useDahlias } from './hooks/useDahlias'
import FilterBar from './components/FilterBar'
import Dashboard from './components/Dashboard'
import DahliaCard from './components/DahliaCard'
import DahliaTable from './components/DahliaTable'
import Bloom from './components/Bloom'
import ThemeToggle from './components/ThemeToggle'
import AddDahliaDialog from './components/AddDahliaDialog'
import StatusDialog from './components/StatusDialog'
import { SHEET_WRITE_URL } from './config'
import './App.css'

export default function App() {
  const { varieties, loading, error, allColors, allTypes, heightRange, addLocal, setStatusLocal, syncIssue, dismissSyncIssue } = useDahlias()
  const [adding, setAdding] = useState(false)

  const [view, setView] = useState('grid')
  const [filters, setFilters] = useState({
    search: '',
    colors: [],
    types: [],
    heightMin: null,
    heightMax: null,
    status: 'all',
  })
  const [statusTarget, setStatusTarget] = useState(null) // { variety, mode }
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
      if (filters.status === 'alive' && v.count === 0) return false
      if (filters.status === 'dead' && v.deadCount === 0) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchesName = v.name.toLowerCase().includes(q)
        const matchesNumber = v.dahliaNumber?.toLowerCase().includes(q)
        if (!matchesName && !matchesNumber) return false
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
        : sortKey === 'dahliaNumber'
          ? Number(aVal) - Number(bVal)
          : String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // Summary stats
  const totalTubers = useMemo(() =>
    varieties.reduce((sum, v) => sum + v.count, 0), [varieties])

  const lostTubers = useMemo(() =>
    varieties.reduce((sum, v) => sum + v.deadCount, 0), [varieties])

  const statusCounts = useMemo(() => ({
    all: varieties.length,
    alive: varieties.filter(v => v.count > 0).length,
    dead: varieties.filter(v => v.deadCount > 0).length,
  }), [varieties])

  const filteredTubers = useMemo(() =>
    filtered.reduce((sum, v) => sum + v.count, 0), [filtered])

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__blooms" aria-hidden="true">
          <Bloom colors={['Pink', 'Dark Pink']} size={260} className="hero__bloom hero__bloom--a" />
          <Bloom colors={['Orange', 'Yellow']} size={170} className="hero__bloom hero__bloom--b" />
          <Bloom colors={['Lavender', 'White']} size={120} className="hero__bloom hero__bloom--c" />
        </div>
        <div className="hero__inner">
          <div className="hero__top">
            <span className="hero__eyebrow">A dahlia catalogue</span>
            <ThemeToggle />
          </div>
          <h1 className="hero__title">Leif’s Paradise</h1>
          <p className="hero__lede">Every variety in the garden: its colors, form, height and how many tubers are waiting for spring.</p>
          {!loading && !error && (
            <dl className="hero__stats">
              <div><dt>Varieties</dt><dd>{varieties.length}</dd></div>
              <div><dt>Living tubers</dt><dd>{totalTubers}</dd></div>
              <div><dt>Colors</dt><dd>{allColors.length}</dd></div>
              <div><dt>Forms</dt><dd>{allTypes.length}</dd></div>
              {lostTubers > 0 && (
                <div className="hero__stat--lost">
                  <dt>Lost</dt><dd>{lostTubers}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </header>

      {loading && (
        <div className="state-msg">
          <Bloom colors={['Pink']} size={40} className="spinner-bloom" />
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
            filteredTubers={filteredTubers}
            view={view}
            onViewChange={setView}
            onAdd={SHEET_WRITE_URL ? () => setAdding(true) : null}
            statusCounts={statusCounts}
          />

          {syncIssue && (
            <div className="sync-issue" role="alert">
              <strong>The change was saved by the script, but it hasn’t appeared in the sheet this site reads.</strong>
              <span> It may have been written to a different file or tab. Open the script’s web-app URL in a browser to see where it writes.</span>
              <button className="link-btn" onClick={dismissSyncIssue}>Dismiss</button>
            </div>
          )}

          <Dashboard
            varieties={varieties}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          <main className="app-main">
            {sorted.length === 0 ? (
              <div className="state-msg state-msg--empty">
                <Bloom colors={['White']} size={64} />
                <p>No dahlias match these filters.</p>
                <button className="btn" onClick={() => setFilters({ search: '', colors: [], types: [], heightMin: null, heightMax: null, status: 'all' })}>Clear filters</button>
              </div>
            ) : view === 'grid' ? (
              <>
                <div className="dahlia-grid">
                  {sorted.map(v => (
                    <DahliaCard
                      key={v.name}
                      variety={v}
                      onSetStatus={SHEET_WRITE_URL ? (variety, mode) => setStatusTarget({ variety, mode }) : null}
                    />
                  ))}
                </div>
              </>
            ) : (
              <DahliaTable
                varieties={sorted}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onSetStatus={SHEET_WRITE_URL ? (variety, mode) => setStatusTarget({ variety, mode }) : null}
              />
            )}
          </main>

          {SHEET_WRITE_URL && (
            <AddDahliaDialog
              open={adding}
              onClose={() => setAdding(false)}
              varieties={varieties}
              allColors={allColors}
              allTypes={allTypes}
              onAdded={addLocal}
            />
          )}

          {SHEET_WRITE_URL && (
            <StatusDialog
              variety={statusTarget?.variety ?? null}
              mode={statusTarget?.mode ?? 'Dead'}
              onClose={() => setStatusTarget(null)}
              onChanged={setStatusLocal}
            />
          )}
        </>
      )}
    </div>
  )
}
