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
 *   { pin, action: "setStatus", name, to: "Dead"|"Alive", count }
 *                                                     → flips `count` tubers of that variety
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
    if (body.action === 'setStatus') return json_(setStatus_(body));
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

function isDead_(value) {
  return /dead|מת/i.test(String(value == null ? '' : value));
}

function setStatus_(body) {
  const name = String(body.name || '').trim();
  const to = body.to === 'Dead' ? 'Dead' : body.to === 'Alive' ? 'Alive' : '';
  const count = Math.floor(Number(body.count || 1));
  if (!name) return { ok: false, error: 'Name is required.' };
  if (!to) return { ok: false, error: 'Status must be Dead or Alive.' };
  if (!(count >= 1 && count <= MAX_ROWS_PER_REQUEST)) return { ok: false, error: 'Count is out of range.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: false, error: 'The sheet is empty.' };
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    const nameCol = headers.indexOf('Name');
    const statusCol = headers.indexOf('Dead or Alive');
    if (nameCol < 0 || statusCol < 0) return { ok: false, error: 'Columns "Name" / "Dead or Alive" not found.' };

    const names = sheet.getRange(2, nameCol + 1, lastRow - 1, 1).getValues();
    const statusRange = sheet.getRange(2, statusCol + 1, lastRow - 1, 1);
    const statuses = statusRange.getValues();
    const wantDead = to === 'Dead';

    let changed = 0;
    for (let i = 0; i < names.length && changed < count; i++) {
      if (String(names[i][0]).trim() === name && isDead_(statuses[i][0]) !== wantDead) {
        statuses[i][0] = to;
        changed++;
      }
    }
    if (changed === 0) return { ok: false, error: 'No ' + (wantDead ? 'living' : 'lost') + ' tubers of "' + name + '" found.' };
    statusRange.setValues(statuses);
    return { ok: true, changed: changed };
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
