import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'
import { getColorHex } from '../utils/colors'
import './Dashboard.css'

// filterMin/filterMax are what get written to filter state (null = unbounded)
// countMin/countMax are used to bucket the data for display
const HEIGHT_BUCKETS = [
  { label: '<60 cm',     filterMin: null, filterMax: 59,   countMin: 0,   countMax: 59   },
  { label: '60–90 cm',  filterMin: 60,   filterMax: 90,   countMin: 60,  countMax: 90   },
  { label: '91–120 cm', filterMin: 91,   filterMax: 120,  countMin: 91,  countMax: 120  },
  { label: '>120 cm',   filterMin: 121,  filterMax: null,  countMin: 121, countMax: 9999 },
]

const GREEN_ACTIVE = '#2b6a43'
const GREEN_BASE   = '#7fb894'
const ROSE_ACTIVE  = '#b23a6b'
const ROSE_BASE    = '#e39abb'

const CHART_HEIGHT = 240
const TICK = { fontSize: 13, fontWeight: 600, fill: 'currentColor' }

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const name = label ?? payload[0]?.payload?.name ?? payload[0]?.payload?.label
  return (
    <div className="chart-tooltip">
      <strong>{name}</strong>: {payload[0].value} tubers
    </div>
  )
}

export default function Dashboard({ varieties, filters, onFilterChange }) {
  const colorData = useMemo(() => {
    const map = {}
    varieties.forEach(v => v.colors.forEach(c => {
      map[c] = (map[c] || 0) + v.count
    }))
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [varieties])

  const typeData = useMemo(() => {
    const map = {}
    varieties.forEach(v => {
      if (v.type) map[v.type] = (map[v.type] || 0) + v.count
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [varieties])

  const heightData = useMemo(() =>
    HEIGHT_BUCKETS.map(b => ({
      label: b.label,
      filterMin: b.filterMin,
      filterMax: b.filterMax,
      value: varieties
        .filter(v => v.height !== null && v.height >= b.countMin && v.height <= b.countMax)
        .reduce((sum, v) => sum + v.count, 0),
    })),
  [varieties])

  function toggleColor(name) {
    const next = filters.colors.includes(name)
      ? filters.colors.filter(c => c !== name)
      : [...filters.colors, name]
    onFilterChange({ colors: next })
  }

  function toggleType(data) {
    const name = data.name
    const next = filters.types.includes(name)
      ? filters.types.filter(t => t !== name)
      : [...filters.types, name]
    onFilterChange({ types: next })
  }

  function toggleHeight(data) {
    const isActive = filters.heightMin === data.filterMin && filters.heightMax === data.filterMax
    if (isActive) {
      onFilterChange({ heightMin: null, heightMax: null })
    } else {
      onFilterChange({ heightMin: data.filterMin, heightMax: data.filterMax })
    }
  }

  const heightFiltered = filters.heightMin !== null || filters.heightMax !== null

  return (
    <div className="dashboard">
      <div className="dashboard__inner">

        {/* Color — Pie chart */}
        <div className="dashboard__panel dashboard__panel--donut">
          <div className="dashboard__panel-head">
            <h3>By color</h3>
            <span>Tap a slice to filter</span>
          </div>
          <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={colorData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={1.5}
                cornerRadius={3}
                onClick={(entry) => toggleColor(entry.name)}
                cursor="pointer"
              >
                {colorData.map(entry => {
                  const active = filters.colors.includes(entry.name)
                  const dimmed = filters.colors.length > 0 && !active
                  return (
                    <Cell
                      key={entry.name}
                      fill={getColorHex(entry.name)}
                      opacity={dimmed ? 0.3 : 1}
                      stroke={active ? 'currentColor' : 'rgba(0,0,0,0.12)'}
                      strokeWidth={active ? 2.5 : 1}
                    />
                  )
                })}
              </Pie>
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(127,127,127,0.08)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center" aria-hidden="true">
            <strong>{colorData.length}</strong>
            <span>colors</span>
          </div>
          </div>
          <div className="legend">
            {colorData.slice(0, 8).map(d => (
              <button
                key={d.name}
                className={`legend__item ${filters.colors.includes(d.name) ? 'active' : ''}`}
                onClick={() => toggleColor(d.name)}
              >
                <span className="dot" style={{ background: getColorHex(d.name) }} />
                {d.name} <em>{d.value}</em>
              </button>
            ))}
          </div>
        </div>

        {/* Type — horizontal bar chart */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-head">
            <h3>By form</h3>
            <span>Tubers per form</span>
          </div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={typeData}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 4, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={TICK}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(127,127,127,0.08)' }} />
              <Bar
                dataKey="value"
                radius={[0, 6, 6, 0]}
                barSize={18}
                onClick={toggleType}
                cursor="pointer"
              >
                {typeData.map(entry => {
                  const active = filters.types.includes(entry.name)
                  const dimmed = filters.types.length > 0 && !active
                  return (
                    <Cell
                      key={entry.name}
                      fill={active ? GREEN_ACTIVE : GREEN_BASE}
                      opacity={dimmed ? 0.3 : 1}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Height — vertical bar chart */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-head">
            <h3>By height</h3>
            <span>Tubers per range</span>
          </div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={heightData}
              margin={{ top: 4, right: 20, bottom: 4, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={TICK}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(127,127,127,0.08)' }} />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                barSize={44}
                onClick={toggleHeight}
                cursor="pointer"
              >
                {heightData.map(entry => {
                  const active = filters.heightMin === entry.filterMin && filters.heightMax === entry.filterMax
                  const dimmed = heightFiltered && !active
                  return (
                    <Cell
                      key={entry.label}
                      fill={active ? ROSE_ACTIVE : ROSE_BASE}
                      opacity={dimmed ? 0.3 : 1}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
