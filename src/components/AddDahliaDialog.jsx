import { useEffect, useMemo, useRef, useState } from 'react'
import Bloom from './Bloom'
import { getColorHex } from '../utils/colors'
import { readPin, callSheet } from '../utils/sheetApi'
import './AddDahliaDialog.css'

function nextNumber(varieties) {
  const nums = varieties.map(v => Number(v.dahliaNumber)).filter(n => Number.isFinite(n))
  return nums.length ? String(Math.max(...nums) + 1) : '1'
}

export default function AddDahliaDialog({ open, onClose, varieties, allColors, allTypes, onAdded }) {
  const dialogRef = useRef(null)
  const empty = useMemo(() => ({
    name: '', number: nextNumber(varieties), height: '', colors: [], type: '', status: 'Alive', count: 1,
  }), [varieties])

  const [form, setForm] = useState(empty)
  const [pin, setPin] = useState(readPin)
  const [customColor, setCustomColor] = useState('')
  const [state, setState] = useState({ busy: false, error: '', done: '' })

  const existing = useMemo(
    () => varieties.find(v => v.name.toLowerCase() === form.name.trim().toLowerCase()),
    [varieties, form.name],
  )

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) {
      setForm(empty)
      setState({ busy: false, error: '', done: '' })
      d.showModal()
    } else if (!open && d.open) {
      d.close()
    }
  }, [open, empty])

  const set = patch => setForm(f => ({ ...f, ...patch }))

  function onNameChange(name) {
    const match = varieties.find(v => v.name.toLowerCase() === name.trim().toLowerCase())
    if (match) {
      // Adding tubers to a variety we already have: copy its details.
      set({
        name,
        number: match.dahliaNumber ?? '',
        height: match.height ?? '',
        colors: match.colors,
        type: match.type ?? '',
      })
    } else {
      set({ name })
    }
  }

  function toggleColor(c) {
    set({ colors: form.colors.includes(c) ? form.colors.filter(x => x !== c) : [...form.colors, c] })
  }

  function addCustomColor() {
    const c = customColor.trim().replace(/\b\w/g, ch => ch.toUpperCase())
    if (c && !form.colors.includes(c)) set({ colors: [...form.colors, c] })
    setCustomColor('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setState({ busy: false, error: 'Please enter a name.', done: '' })
    if (!pin.trim()) return setState({ busy: false, error: 'Please enter the PIN.', done: '' })

    const entry = { ...form, name: form.name.trim(), count: Number(form.count) || 1 }
    setState({ busy: true, error: '', done: '' })
    try {
      const res = await callSheet({ pin: pin.trim(), action: 'add', entry })
      onAdded(entry)
      setState({
        busy: false,
        error: '',
        done: `Added ${entry.count} ${entry.count === 1 ? 'tuber' : 'tubers'} of ${entry.name}` +
          (res.row ? ` → row ${res.row}${entry.count > 1 ? `–${res.row + entry.count - 1}` : ''} of “${res.sheet}”.` : '.'),
      })
      setForm(f => ({ ...empty, number: String(Number(f.number) + 1 || '') }))
    } catch (err) {
      setState({ busy: false, error: err.message || 'Something went wrong.', done: '' })
    }
  }

  const colorOptions = [...new Set([...allColors, ...form.colors])].sort()

  return (
    <dialog
      ref={dialogRef}
      className="add-dialog"
      onClose={onClose}
      onClick={e => { if (e.target === dialogRef.current) onClose() }}
    >
      <form className="add-dialog__panel" onSubmit={submit}>
        <header className="add-dialog__head">
          <Bloom colors={form.colors} type={form.type} size={52} />
          <div>
            <h2>Add a dahlia</h2>
            <p>{existing ? 'Adds more tubers to an existing variety.' : 'Writes new rows straight into the Google Sheet.'}</p>
          </div>
          <button type="button" className="add-dialog__close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="add-dialog__body">
          <div className="field field--wide">
            <label htmlFor="ad-name">Variety name</label>
            <input id="ad-name" list="ad-names" required autoComplete="off" value={form.name}
              onChange={e => onNameChange(e.target.value)} placeholder="e.g. Café au Lait" />
            <datalist id="ad-names">{varieties.map(v => <option key={v.name} value={v.name} />)}</datalist>
            {existing && <span className="field__hint">Existing variety · currently ×{existing.count}</span>}
          </div>

          <div className="field">
            <label htmlFor="ad-number">Dahlia #</label>
            <input id="ad-number" inputMode="numeric" value={form.number} onChange={e => set({ number: e.target.value })} />
          </div>

          <div className="field">
            <label htmlFor="ad-height">Height (cm)</label>
            <input id="ad-height" type="number" min="1" max="999" value={form.height} onChange={e => set({ height: e.target.value })} />
          </div>

          <div className="field">
            <label htmlFor="ad-type">Form</label>
            <input id="ad-type" list="ad-types" autoComplete="off" value={form.type} onChange={e => set({ type: e.target.value })} placeholder="e.g. Ball" />
            <datalist id="ad-types">{allTypes.map(t => <option key={t} value={t} />)}</datalist>
          </div>

          <div className="field">
            <label htmlFor="ad-status">Status</label>
            <select id="ad-status" value={form.status} onChange={e => set({ status: e.target.value })}>
              <option value="Alive">Alive</option>
              <option value="Dead">Dead</option>
            </select>
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
            <label htmlFor="ad-count">Tubers</label>
            <div className="stepper">
              <button type="button" onClick={() => set({ count: Math.max(1, Number(form.count) - 1) })} aria-label="Fewer">−</button>
              <input id="ad-count" type="number" min="1" max="50" value={form.count}
                onChange={e => set({ count: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })} />
              <button type="button" onClick={() => set({ count: Math.min(50, Number(form.count) + 1) })} aria-label="More">+</button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="ad-pin">PIN</label>
            <input id="ad-pin" type="password" inputMode="numeric" autoComplete="current-password"
              value={pin} onChange={e => setPin(e.target.value)} placeholder="Garden code" />
          </div>
        </div>

        {(state.error || state.done) && (
          <div className={`add-dialog__msg ${state.error ? 'is-error' : 'is-ok'}`} role="status">
            {state.error || state.done}
          </div>
        )}

        <footer className="add-dialog__foot">
          <button type="button" className="btn" onClick={onClose}>{state.done ? 'Done' : 'Cancel'}</button>
          <button type="submit" className="btn btn--primary" disabled={state.busy}>
            {state.busy ? 'Saving…' : `Add ${form.count > 1 ? `${form.count} tubers` : 'tuber'}`}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
