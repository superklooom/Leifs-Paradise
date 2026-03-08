import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'
import './Dashboard.css'

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
  return '#aaa'
}

// filterMin/filterMax are what get written to filter state (null = unbounded)
// countMin/countMax are used to bucket the data for display
const HEIGHT_BUCKETS = [
  { label: '<60 cm',     filterMin: null, filterMax: 59,   countMin: 0,   countMax: 59   },
  { label: '60–90 cm',  filterMin: 60,   filterMax: 90,   countMin: 60,  countMax: 90   },
  { label: '91–120 cm', filterMin: 91,   filterMax: 120,  countMin: 91,  countMax: 120  },
  { label: '>120 cm',   filterMin: 121,  filterMax: null,  countMin: 121, countMax: 9999 },
]

const GREEN_ACTIVE = '#2d6a4f'
const GREEN_BASE   = '#74b49b'
const BLUE_ACTIVE  = '#2c6e8a'
const BLUE_BASE    = '#7db0c8'

const CHART_HEIGHT = 300

function renderPieLabel({ name, percent }) {
  if (percent < 0.05) return ''
  return `${name} ${Math.round(percent * 100)}%`
}

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
        <div className="dashboard__panel">
          <div className="dashboard__panel-title">By Color</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={colorData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={renderPieLabel}
                labelLine={true}
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
                      stroke={active ? '#333' : 'rgba(0,0,0,0.1)'}
                      strokeWidth={active ? 2.5 : 1}
                    />
                  )
                })}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Type — horizontal bar chart */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-title">By Type</div>
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
                tick={{ fontSize: 14, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
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
          <div className="dashboard__panel-title">By Height</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={heightData}
              margin={{ top: 4, right: 20, bottom: 4, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 14, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                onClick={toggleHeight}
                cursor="pointer"
              >
                {heightData.map(entry => {
                  const active = filters.heightMin === entry.filterMin && filters.heightMax === entry.filterMax
                  const dimmed = heightFiltered && !active
                  return (
                    <Cell
                      key={entry.label}
                      fill={active ? BLUE_ACTIVE : BLUE_BASE}
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
