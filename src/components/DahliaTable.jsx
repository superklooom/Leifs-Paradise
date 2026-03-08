import './DahliaTable.css'

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
}

function getColorHex(name) {
  if (COLOR_HEX[name]) return COLOR_HEX[name]
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(COLOR_HEX)) {
    if (lower.includes(key.toLowerCase())) return val
  }
  return '#ccc'
}

export default function DahliaTable({ varieties, sortKey, sortDir, onSort }) {
  function SortHeader({ col, label }) {
    const active = sortKey === col
    return (
      <th
        className={`sortable ${active ? 'active' : ''}`}
        onClick={() => onSort(col)}
      >
        {label}
        <span className="sort-arrow">
          {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
        </span>
      </th>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="dahlia-table">
        <thead>
          <tr>
            <SortHeader col="name" label="Variety" />
            <SortHeader col="colors" label="Colors" />
            <SortHeader col="type" label="Type" />
            <SortHeader col="height" label="Height (cm)" />
            <SortHeader col="count" label="Tubers" />
          </tr>
        </thead>
        <tbody>
          {varieties.map(v => (
            <tr key={v.name}>
              <td className="td-name">{v.name}</td>
              <td>
                <div className="td-colors">
                  {v.colors.map(c => (
                    <span key={c} className="color-pill">
                      <span
                        className="color-dot"
                        style={{ background: getColorHex(c) }}
                      />
                      {c}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                {v.type && (
                  <span className="type-badge">{v.type}</span>
                )}
              </td>
              <td className="td-height">{v.height ?? '—'}</td>
              <td className="td-count">
                <span className="count-badge">×{v.count}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
