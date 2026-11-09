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

const STATUS_COL = 'Dead or Alive'

/** Anything that says dead (any case, or Hebrew "מת") counts as dead; blank = alive. */
export function isDeadStatus(value) {
  return /dead|מת/i.test(String(value ?? ''))
}

function countWithStatus(rows, name, dead) {
  return rows.filter(r => r['Name']?.trim() === name && isDeadStatus(r[STATUS_COL]) === dead).length
}

/** Apply not-yet-visible status changes: flip rows until `target` rows of that name have the status. */
function applyStatusOps(rows, ops) {
  if (!ops.length) return rows
  const out = rows.map(r => ({ ...r }))
  ops.forEach(({ name, to, target }) => {
    const dead = to === 'Dead'
    let have = countWithStatus(out, name, dead)
    for (const r of out) {
      if (have >= target) break
      if (r['Name']?.trim() === name && isDeadStatus(r[STATUS_COL]) !== dead) {
        r[STATUS_COL] = to
        have++
      }
    }
  })
  return out
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
        count: 0,      // living tubers
        deadCount: 0,  // lost tubers
      }
    }
    if (isDeadStatus(row[STATUS_COL])) groups[name].deadCount++
    else groups[name].count++
  })
  return Object.values(groups)
    .map(v => ({ ...v, total: v.count + v.deadCount, isLost: v.count === 0 && v.deadCount > 0 }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function useDahlias() {
  const [sheetRows, setSheetRows] = useState([])
  // Rows we just wrote but the (slightly cached) read feed may not show yet.
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Status changes we just wrote: [{ name, to: 'Dead'|'Alive', target }]
  const [statusOps, setStatusOps] = useState([])
  // Set when a write was confirmed by the script but never showed up in the sheet we read.
  const [syncIssue, setSyncIssue] = useState(false)
  const syncRef = useRef({ baseLen: 0, pendingLen: 0, tries: 0, ops: [] })

  const load = useCallback(() => {
    // Cache-buster so a reload after a write isn't served a stale copy.
    return fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&_=${Date.now()}`)
      .then(r => r.text())
      .then(text => {
        const parsed = parseGViz(text)
        const sync = syncRef.current
        setSheetRows(parsed)
        if (sync.pendingLen > 0 && parsed.length >= sync.baseLen + sync.pendingLen) {
          // The sheet has caught up: drop the local copies.
          setPending([])
          sync.pendingLen = 0
        }
        if (sync.ops.length) {
          sync.ops = sync.ops.filter(op => countWithStatus(parsed, op.name, op.to === 'Dead') < op.target)
          setStatusOps(sync.ops)
        }
        if (sync.pendingLen > 0 || sync.ops.length) {
          if (++sync.tries < 6) setTimeout(load, 5000)
          else setSyncIssue(true)
        } else {
          setSyncIssue(false)
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

  const rowsBeforeOps = useMemo(() => [...sheetRows, ...pending], [sheetRows, pending])

  // Mark `count` tubers of a variety as Dead (or Alive) locally, then re-sync.
  const setStatusLocal = useCallback(({ name, to, count }) => {
    const current = applyStatusOps(rowsBeforeOps, syncRef.current.ops)
    const target = countWithStatus(current, name, to === 'Dead') + count
    const sync = syncRef.current
    sync.ops = [...sync.ops.filter(op => op.name !== name), { name, to, target }]
    sync.tries = 0
    setStatusOps(sync.ops)
    setTimeout(load, 3000)
  }, [rowsBeforeOps, load])

  const rows = useMemo(() => applyStatusOps(rowsBeforeOps, statusOps), [rowsBeforeOps, statusOps])
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

  return { varieties, loading, error, allColors, allTypes, heightRange, addLocal, setStatusLocal, syncIssue, dismissSyncIssue: () => setSyncIssue(false), reload: load }
}
