import { useEffect, useRef, useState } from 'react'
import Bloom from './Bloom'
import { readPin, callSheet } from '../utils/sheetApi'
import './AddDahliaDialog.css'

/**
 * Mark tubers of one variety as lost (Dead) or bring them back (Alive).
 * `mode` is 'Dead' or 'Alive'.
 */
export default function StatusDialog({ variety, mode, onClose, onChanged }) {
  const dialogRef = useRef(null)
  const max = variety ? (mode === 'Dead' ? variety.count : variety.deadCount) : 1
  const [count, setCount] = useState(1)
  const [pin, setPin] = useState(readPin)
  const [state, setState] = useState({ busy: false, error: '' })

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (variety && !d.open) {
      setCount(mode === 'Dead' ? max : 1)
      setState({ busy: false, error: '' })
      d.showModal()
    } else if (!variety && d.open) {
      d.close()
    }
  }, [variety, mode, max])

  async function submit(e) {
    e.preventDefault()
    if (!pin.trim()) return setState({ busy: false, error: 'Please enter the PIN.' })
    setState({ busy: true, error: '' })
    try {
      await callSheet({ pin: pin.trim(), action: 'setStatus', name: variety.name, to: mode, count })
      onChanged({ name: variety.name, to: mode, count })
      onClose()
    } catch (err) {
      setState({ busy: false, error: err.message || 'Something went wrong.' })
    }
  }

  const lost = mode === 'Dead'

  return (
    <dialog
      ref={dialogRef}
      className="add-dialog add-dialog--small"
      onClose={onClose}
      onClick={e => { if (e.target === dialogRef.current) onClose() }}
    >
      {variety && (
        <form className="add-dialog__panel" onSubmit={submit}>
          <header className="add-dialog__head">
            <Bloom colors={variety.colors} size={52} className={lost ? 'bloom--wilted' : ''} />
            <div>
              <h2>{lost ? 'Mark as lost' : 'Bring back'}</h2>
              <p>{variety.name}</p>
            </div>
            <button type="button" className="add-dialog__close" onClick={onClose} aria-label="Close">✕</button>
          </header>

          <div className="add-dialog__body">
            <p className="field--wide status-note">
              {lost
                ? `${variety.count} living ${variety.count === 1 ? 'tuber' : 'tubers'}. How many did we lose?`
                : `${variety.deadCount} lost ${variety.deadCount === 1 ? 'tuber' : 'tubers'}. How many are actually alive?`}
            </p>

            <div className="field">
              <label htmlFor="sd-count">Tubers</label>
              <div className="stepper">
                <button type="button" onClick={() => setCount(c => Math.max(1, c - 1))} aria-label="Fewer">−</button>
                <input id="sd-count" type="number" min="1" max={max} value={count}
                  onChange={e => setCount(Math.min(max, Math.max(1, Number(e.target.value) || 1)))} />
                <button type="button" onClick={() => setCount(c => Math.min(max, c + 1))} aria-label="More">+</button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="sd-pin">PIN</label>
              <input id="sd-pin" type="password" inputMode="numeric" autoComplete="current-password"
                value={pin} onChange={e => setPin(e.target.value)} placeholder="Garden code" />
            </div>
          </div>

          {state.error && <div className="add-dialog__msg is-error" role="status">{state.error}</div>}

          <footer className="add-dialog__foot">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn ${lost ? 'btn--danger' : 'btn--primary'}`} disabled={state.busy}>
              {state.busy ? 'Saving…' : lost
                ? (count === variety.count ? 'Mark all as lost' : `Mark ${count} as lost`)
                : `Revive ${count}`}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  )
}
