import { useEffect, useRef, useState } from 'react'
import Bloom from './Bloom'
import { getColorHex } from '../utils/colors'
import { readPin, callSheet } from '../utils/sheetApi'
import './AddDahliaDialog.css'

const MAX_TUBERS = 200

function Stepper({ id, value, onChange, max = MAX_TUBERS }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Fewer">−</button>
      <input id={id} type="number" min="0" max={max} value={value}
        onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))} />
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="More">+</button>
    </div>
  )
}

function initialForm(v) {
  return {
    name: v.name,
    number: v.dahliaNumber ?? '',
    height: v.height ?? '',
    colors: v.colors,
    type: v.type ?? '',
    alive: v.count,
    dead: v.deadCount,
  }
}

/** Edit a variety's details and set its living / lost tuber counts. */
export default function EditDahliaDialog({ variety, varieties, allColors, allTypes, onClose, onSaved }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(null)
  const [pin, setPin] = useState(readPin)
  const [customColor, setCustomColor] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [state, setState] = useState({ busy: false, error: '' })

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (variety && !d.open) {
      setForm(initialForm(variety))
      setConfirmDelete(false)
      setCustomColor('')
      setState({ busy: false, error: '' })
      d.showModal()
    } else if (!variety && d.open) {
      d.close()
    }
  }, [variety])

  const set = patch => setForm(f => ({ ...f, ...patch }))

  function toggleColor(c) {
    set({ colors: form.colors.includes(c) ? form.colors.filter(x => x !== c) : [...form.colors, c] })
  }
  function addCustomColor() {
    const c = customColor.trim().replace(/\b\w/g, ch => ch.toUpperCase())
    if (c && !form.colors.includes(c)) set({ colors: [...form.colors, c] })
    setCustomColor('')
  }

  async function save({ remove = false } = {}) {
    if (!pin.trim()) return setState({ busy: false, error: 'Please enter the PIN.' })
    const name = form.name.trim()
    if (!name) return setState({ busy: false, error: 'Name cannot be empty.' })
    if (!remove && name.toLowerCase() !== variety.name.toLowerCase() &&
        varieties.some(v => v.name.toLowerCase() === name.toLowerCase())) {
      return setState({ busy: false, error: `A variety called "${name}" already exists.` })
    }

    // Only send fields that actually changed.
    const changes = {}
    if (!remove) {
      if (name !== variety.name) changes.name = name
      if (String(form.number) !== String(variety.dahliaNumber ?? '')) changes.number = String(form.number).trim()
      if (String(form.height) !== String(variety.height ?? '')) changes.height = form.height
      if (form.colors.join(', ') !== variety.colors.join(', ')) changes.colors = form.colors
      if (form.type.trim() !== (variety.type ?? '')) changes.type = form.type.trim()
    }
    const alive = remove ? 0 : form.alive
    const dead = remove ? 0 : form.dead

    if (!remove && !Object.keys(changes).length && alive === variety.count && dead === variety.deadCount) {
      return onClose()
    }

    setState({ busy: true, error: '' })
    try {
      await callSheet({ pin: pin.trim(), action: 'update', name: variety.name, changes, alive, dead })
      onSaved({ variety, changes, alive, dead })
      onClose()
    } catch (err) {
      setState({ busy: false, error: err.message || 'Something went wrong.' })
    }
  }

  const colorOptions = form ? [...new Set([...allColors, ...form.colors])].sort() : []
  const deltaAlive = form && variety ? form.alive - variety.count : 0
  const deltaDead = form && variety ? form.dead - variety.deadCount : 0
  const delta = n => (n > 0 ? `+${n}` : n < 0 ? `${n}` : '')

  return (
    <dialog
      ref={dialogRef}
      className="add-dialog"
      onClose={onClose}
      onClick={e => { if (e.target === dialogRef.current) onClose() }}
    >
      {variety && form && (
        <form className="add-dialog__panel" onSubmit={e => { e.preventDefault(); save() }}>
          <header className="add-dialog__head">
            <Bloom colors={form.colors} type={form.type} size={52} className={form.alive === 0 && form.dead > 0 ? 'bloom--wilted' : ''} />
            <div>
              <h2>Edit dahlia</h2>
              <p>{variety.name} · {variety.count} living{variety.deadCount ? ` · ${variety.deadCount} lost` : ''}</p>
            </div>
            <button type="button" className="add-dialog__close" onClick={onClose} aria-label="Close">✕</button>
          </header>

          <div className="add-dialog__body">
            <div className="field field--wide">
              <label htmlFor="ed-name">Variety name</label>
              <input id="ed-name" required autoComplete="off" value={form.name} onChange={e => set({ name: e.target.value })} />
            </div>

            <div className="field">
              <label htmlFor="ed-number">Dahlia #</label>
              <input id="ed-number" inputMode="numeric" value={form.number} onChange={e => set({ number: e.target.value })} />
            </div>

            <div className="field">
              <label htmlFor="ed-height">Height (cm)</label>
              <input id="ed-height" type="number" min="1" max="999" value={form.height} onChange={e => set({ height: e.target.value })} />
            </div>

            <div className="field field--wide">
              <label htmlFor="ed-type">Form</label>
              <input id="ed-type" list="ed-types" autoComplete="off" value={form.type} onChange={e => set({ type: e.target.value })} />
              <datalist id="ed-types">{allTypes.map(t => <option key={t} value={t} />)}</datalist>
            </div>

            <div className="field field--wide">
              <label>Colors</label>
              <div className="chips">
                {colorOptions.map(c => (
                  <button type="button" key={c} className={`chip ${form.colors.includes(c) ? 'active' : ''}`}
                    aria-pressed={form.colors.includes(c)} onClick={() => toggleColor(c)}>
                    <span className="dot" style={{ background: getColorHex(c) }} />{c}
                  </button>
                ))}
                <span className="chip-add">
                  <input value={customColor} placeholder="New color…" onChange={e => setCustomColor(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomColor() } }} />
                  <button type="button" onClick={addCustomColor} disabled={!customColor.trim()}>Add</button>
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="ed-alive">
                Living tubers {deltaAlive !== 0 && <span className={`delta ${deltaAlive > 0 ? 'up' : 'down'}`}>{delta(deltaAlive)}</span>}
              </label>
              <Stepper id="ed-alive" value={form.alive} onChange={alive => set({ alive })} />
            </div>

            <div className="field">
              <label htmlFor="ed-dead">
                Lost tubers {deltaDead !== 0 && <span className={`delta ${deltaDead > 0 ? 'up' : 'down'}`}>{delta(deltaDead)}</span>}
              </label>
              <Stepper id="ed-dead" value={form.dead} onChange={dead => set({ dead })} />
            </div>

            {form.alive + form.dead === 0 && (
              <p className="field--wide edit-note">With no tubers left, saving removes this variety from the sheet.</p>
            )}

            <div className="field field--wide">
              <label htmlFor="ed-pin">PIN</label>
              <input id="ed-pin" type="password" inputMode="numeric" autoComplete="current-password"
                value={pin} onChange={e => setPin(e.target.value)} placeholder="Garden code" />
            </div>
          </div>

          {state.error && <div className="add-dialog__msg is-error" role="status">{state.error}</div>}

          <footer className="add-dialog__foot">
            {confirmDelete ? (
              <span className="delete-confirm">
                Delete all {variety.count + variety.deadCount} rows?
                <button type="button" className="btn btn--danger" disabled={state.busy} onClick={() => save({ remove: true })}>
                  {state.busy ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button type="button" className="link-btn" onClick={() => setConfirmDelete(false)}>Keep</button>
              </span>
            ) : (
              <button type="button" className="link-btn delete-link" onClick={() => setConfirmDelete(true)}>Delete variety</button>
            )}
            <span className="add-dialog__spacer" />
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={state.busy || confirmDelete}>
              {state.busy && !confirmDelete ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  )
}
