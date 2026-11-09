/**
 * Leif's Paradise — write endpoint for the dahlia Google Sheet.
 *
 * Setup (once): see apps-script/README.md
 *  - Paste this file into Extensions → Apps Script of the sheet.
 *  - Project Settings → Script properties → add  PIN = <your secret code>
 *  - Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *
 * The site POSTs JSON (as text/plain, to avoid a CORS preflight):
 *   { pin, action: "verify" }                         → checks the PIN only
 *   { pin, action: "add", entry: {                    → appends `count` rows
 *       name, number, height, colors: [..], type, status, count } }
 */

const MAX_ROWS_PER_REQUEST = 50;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('PIN');
    if (!expected) return json_({ ok: false, error: 'PIN is not configured in Script properties.' });
    if (String(body.pin || '') !== String(expected)) return json_({ ok: false, error: 'Wrong PIN.' });

    if (body.action === 'verify') return json_({ ok: true });
    if (body.action === 'add') return json_(addEntry_(body.entry || {}));
    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "Leif's Paradise sheet writer" });
}

function addEntry_(entry) {
  const name = String(entry.name || '').trim();
  if (!name) return { ok: false, error: 'Name is required.' };

  const count = Math.floor(Number(entry.count || 1));
  if (!(count >= 1 && count <= MAX_ROWS_PER_REQUEST)) {
    return { ok: false, error: 'Count must be between 1 and ' + MAX_ROWS_PER_REQUEST + '.' };
  }

  const height = entry.height === '' || entry.height == null ? '' : Number(entry.height);
  if (height !== '' && !(height > 0 && height < 1000)) return { ok: false, error: 'Height looks wrong.' };

  const colors = (Array.isArray(entry.colors) ? entry.colors : String(entry.colors || '').split(','))
    .map(function (c) { return String(c).trim(); })
    .filter(Boolean)
    .join(', ');

  const values = {
    'Dahlia Number': String(entry.number || '').trim(),
    'Name': name,
    'Dead or Alive': String(entry.status || 'Alive').trim(),
    'Height (cm)': height,
    'Colors': colors,
    'Type': String(entry.type || '').trim(),
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });

    const row = headers.map(function (h) { return h in values ? values[h] : ''; });
    const rows = [];
    for (let i = 0; i < count; i++) rows.push(row.slice());

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, added: count };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
