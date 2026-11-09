// Single source of truth for dahlia color names → swatch hex.
export const COLOR_HEX = {
  Red: '#c0392b',
  Pink: '#e8669b',
  Orange: '#e67e22',
  Yellow: '#f2c230',
  White: '#f4efe6',
  Purple: '#8e44ad',
  Lavender: '#c39bd3',
  Burgundy: '#6c1f2e',
  Salmon: '#fa8072',
  Coral: '#ff6b6b',
  Peach: '#ffc39b',
  Cream: '#fbefcf',
  Violet: '#7a3ff0',
  Lilac: '#c8a2c8',
  Magenta: '#c2185b',
  'Dark Red': '#8b0000',
  'Dark Pink': '#d94c7e',
  Blue: '#5b84d6',
  Green: '#6aa84f',
  Bi: '#999999',
}

export function getColorHex(name, fallback = '#c9c2b8') {
  if (!name) return fallback
  if (COLOR_HEX[name]) return COLOR_HEX[name]
  const lower = name.toLowerCase()
  // Prefer the longest matching key ("Dark Pink" before "Pink")
  const match = Object.keys(COLOR_HEX)
    .sort((a, b) => b.length - a.length)
    .find(key => lower.includes(key.toLowerCase()))
  return match ? COLOR_HEX[match] : fallback
}
