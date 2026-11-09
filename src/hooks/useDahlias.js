import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

const SHEET_ID = '1wfbgTeYJrD1O9oOOVBTNxEjAyMZidPbWDRB4PTGHpiw'

function parseGViz(text) {
  // Strip the JSONP wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const data = JSON.parse(text.slice(start, end + 1))

  const cols = data.table.cols.map(c => c.label)
  return data.table.rows
    .filter(row => row && row.c)
    .map(row => {
      const obj = {}
      row.c.forEach((cell, i) => {
        // Use formatted value (f) if present, otherwise raw value (v)
        obj[cols[i]] = cell ? (cell.f ?? cell.v) : null
      })
      return obj
    })
}

function groupByVariety(rows) {
  const groups = {}
  rows.forEach(row => {
    const name = row['Name']?.trim()
    if (!name) return

    if (!groups[name]) {
      const rawColors = row['Colors'] || ''
      const colors = rawColors
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)

      groups[name] = {
        name,
        dahliaNumber: row['Dahlia Number']?.toString().trim() || null,
        height: row['Height (cm)'] !== null && row['Height (cm)'] !== '' ? Number(row['Height (cm)']) : null,
        colors,
        type: row['Type']?.trim() || null,
        count: 0,
      }
    }
    groups[name].count++
  })
  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
}

export function useDahlias() {
  const [sheetRows, setSheetRows] = useState([])
  // Rows we just wrote but the (slightly cached) read feed may not show yet.
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const syncRef = useRef({ baseLen: 0, pendingLen: 0, tries: 0 })

  const load = useCallback(() => {
    // Cache-buster so a reload after a write isn't served a stale copy.
    return fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&_=${Date.now()}`)
      .then(r => r.text())
      .then(text => {
        const parsed = parseGViz(text)
        const sync = syncRef.current
        setSheetRows(parsed)
        if (sync.pendingLen > 0) {
          if (parsed.length >= sync.baseLen + sync.pendingLen) {
            // The sheet has caught up: drop the local copies.
            setPending([])
            sync.pendingLen = 0
          } else if (++sync.tries < 6) {
            setTimeout(load, 5000)
          }
        }
        setError(null)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  // Show freshly written rows immediately, then re-sync with the sheet.
  const addLocal = useCallback(entry => {
    const row = {
      'Dahlia Number': entry.number || null,
      'Name': entry.name,
      'Dead or Alive': entry.status || 'Alive',
      'Height (cm)': entry.height === '' || entry.height == null ? null : Number(entry.height),
      'Colors': entry.colors.join(', '),
      'Type': entry.type || null,
    }
    const added = Array.from({ length: entry.count }, () => ({ ...row }))
    const sync = syncRef.current
    if (sync.pendingLen === 0) sync.baseLen = sheetRows.length
    sync.pendingLen += added.length
    sync.tries = 0
    setPending(prev => [...prev, ...added])
    setTimeout(load, 3000)
  }, [load, sheetRows.length])

  const rows = useMemo(() => [...sheetRows, ...pending], [sheetRows, pending])
  const varieties = useMemo(() => groupByVariety(rows), [rows])

  const allColors = useMemo(() => {
    const set = new Set()
    varieties.forEach(v => v.colors.forEach(c => set.add(c)))
    return [...set].sort()
  }, [varieties])

  const allTypes = useMemo(() => {
    const set = new Set()
    varieties.forEach(v => v.type && set.add(v.type))
    return [...set].sort()
  }, [varieties])

  const heightRange = useMemo(() => {
    const heights = varieties.map(v => v.height).filter(h => h !== null)
    if (heights.length === 0) return { min: 0, max: 200 }
    return { min: Math.min(...heights), max: Math.max(...heights) }
  }, [varieties])

  return { varieties, loading, error, allColors, allTypes, heightRange, addLocal, reload: load }
}
