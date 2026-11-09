// Sort options shared by the toolbar menu and the table headers.
// `dir` is the natural first direction when the option is picked.
export const SORT_OPTIONS = [
  { key: 'dahliaNumber', label: 'Dahlia #', dir: 'asc' },
  { key: 'count', label: 'Living tubers', dir: 'desc' },
  { key: 'deadCount', label: 'Lost tubers', dir: 'desc' },
  { key: 'name', label: 'Name', dir: 'asc' },
  { key: 'height', label: 'Height', dir: 'desc' },
  { key: 'type', label: 'Form', dir: 'asc' },
  { key: 'colors', label: 'Color', dir: 'asc' },
]

export const defaultDir = key => SORT_OPTIONS.find(o => o.key === key)?.dir ?? 'asc'

function value(v, key) {
  if (key === 'colors') return v.colors.length ? v.colors.join(', ') : null
  if (key === 'dahliaNumber') {
    if (v.dahliaNumber == null || v.dahliaNumber === '') return null
    const n = Number(v.dahliaNumber)
    return Number.isFinite(n) ? n : String(v.dahliaNumber)
  }
  const x = v[key]
  return x === '' || x === undefined ? null : x
}

/** Sort varieties; empty values always go last, ties are broken by name. */
export function sortVarieties(list, key, dir) {
  const sign = dir === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    const av = value(a, key)
    const bv = value(b, key)
    if (av === null && bv !== null) return 1
    if (bv === null && av !== null) return -1
    let cmp = 0
    if (av !== null) {
      cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    }
    return cmp !== 0 ? sign * cmp : a.name.localeCompare(b.name)
  })
}
