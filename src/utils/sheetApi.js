import { SHEET_WRITE_URL } from '../config'

const PIN_KEY = 'lp-pin'

export function readPin() {
  try { return localStorage.getItem(PIN_KEY) || '' } catch { return '' }
}

export function savePin(pin) {
  try { localStorage.setItem(PIN_KEY, pin) } catch { /* ignore */ }
}

/** POST an action to the Apps Script web app. Throws with the script's message on failure. */
export async function callSheet(payload) {
  const res = await fetch(SHEET_WRITE_URL, {
    method: 'POST',
    // text/plain keeps this a "simple" request, which Apps Script accepts cross-origin.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'The sheet rejected the request.')
  savePin(payload.pin)
  return data
}
