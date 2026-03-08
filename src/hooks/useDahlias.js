import { useState, useEffect, useMemo } from 'react'

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
        height: row['Height (cm)'] !== null ? Number(row['Height (cm)']) : null,
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
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`)
      .then(r => r.text())
      .then(text => {
        setRows(parseGViz(text))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

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

  return { varieties, loading, error, allColors, allTypes, heightRange }
}
