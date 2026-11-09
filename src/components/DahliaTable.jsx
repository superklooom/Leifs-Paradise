import Bloom from './Bloom'
import { getColorHex } from '../utils/colors'
import './DahliaTable.css'

export default function DahliaTable({ varieties, sortKey, sortDir, onSort, onSetStatus, onEdit }) {
  function SortHeader({ col, label }) {
    const active = sortKey === col
    return (
      <th
        className={`sortable ${active ? 'active' : ''}`}
        onClick={() => onSort(col)}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span className="th-inner">
          {label}
          <span className="sort-arrow" aria-hidden="true">
            {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
          </span>
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
            <SortHeader col="dahliaNumber" label="Dahlia #" />
            <SortHeader col="colors" label="Colors" />
            <SortHeader col="type" label="Form" />
            <SortHeader col="height" label="Height" />
            <SortHeader col="count" label="Tubers" />
            <SortHeader col="deadCount" label="Status" />
            {onSetStatus && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {varieties.map(v => (
            <tr key={v.name} className={v.isLost ? 'is-lost' : ''}>
              <td className="td-name"><span className="td-name__inner"><Bloom colors={v.colors} size={30} className={v.isLost ? 'bloom--wilted' : ''} />{v.name}</span></td>
              <td className="td-number">{v.dahliaNumber ?? '—'}</td>
              <td>
                <div className="td-colors">
                  {v.colors.map(c => (
                    <span key={c} className="tag">
                      <span
                        className="dot"
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
              <td className="td-height">{v.height ? `${v.height} cm` : '—'}</td>
              <td className="td-count">
                <span className="count-badge">×{v.count}</span>
              </td>
              <td className="td-status">
                {v.isLost
                  ? <span className="status-pill status-pill--lost">Lost</span>
                  : v.deadCount > 0
                    ? <span className="status-pill status-pill--partial">{v.deadCount} lost</span>
                    : <span className="status-pill status-pill--alive">Alive</span>}
              </td>
              {onSetStatus && (
                <td className="td-actions">
                  {onEdit && <button type="button" onClick={() => onEdit(v)}>Edit</button>}
                  {v.count > 0 && <button type="button" onClick={() => onSetStatus(v, 'Dead')}>Mark lost</button>}
                  {v.deadCount > 0 && <button type="button" onClick={() => onSetStatus(v, 'Alive')}>Revive</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
