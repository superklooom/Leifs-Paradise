/**
 * Leif's Paradise — write endpoint for the dahlia Google Sheet.
 *
 * Setup (once): see apps-script/README.md
 *  - Paste this file into Extensions → Apps Script of the sheet (or any Apps Script project).
 *  - Project Settings → Script properties → add  PIN = <your secret code>
 *  - Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *
 * The site POSTs JSON (as text/plain, to avoid a CORS preflight):
 *   { pin, action: "verify" }                         → checks the PIN only
 *   { pin, action: "add", entry: {                    → appends `count` rows
 *       name, number, height, colors: [..], type, status, count } }
 *   { pin, action: "setStatus", name, to: "Dead"|"Alive", count }
 *                                                     → flips `count` tubers of that variety
 *   { pin, action: "update", name, changes: { name, number, height, colors, type },
 *     alive, dead }                                   → edits a variety and sets its tuber counts
 *                                                       (rows are added/deleted to match; 0 + 0 deletes it)
 */

const MAX_ROWS_PER_REQUEST = 50;
const SCRIPT_VERSION = '4';

// The spreadsheet the website reads from. Opening it by ID means the script writes to the
// right file even if it was created from script.google.com instead of the sheet's menu.
const SPREADSHEET_ID = '1wfbgTeYJrD1O9oOOVBTNxEjAyMZidPbWDRB4PTGHpiw';

/**
 * Find the tab and header row holding the dahlia table: the first tab (the one the website
 * reads) if it has a "Name" column in its first rows, otherwise any tab that does.
 */
function getTable_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  for (let s = 0; s < sheets.length; s++) {
    const sheet = sheets[s];
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) continue;
    const top = sheet.getRange(1, 1, Math.min(5, Math.max(1, sheet.getLastRow())), lastCol).getValues();
    for (let r = 0; r < top.length; r++) {
      const headers = top[r].map(function (h) { return String(h).trim(); });
      if (headers.indexOf('Name') >= 0) {
        return { ss: ss, sheet: sheet, headerRow: r + 1, headers: headers };
      }
    }
  }
  throw new Error('Could not find a tab with a "Name" column.');
}

/** Last row that actually has a name (ignores formatting, checkboxes or formulas further down). */
function lastNamedRow_(t) {
  const nameCol = t.headers.indexOf('Name') + 1;
  const last = t.sheet.getLastRow();
  if (last <= t.headerRow) return t.headerRow;
  const names = t.sheet.getRange(t.headerRow + 1, nameCol, last - t.headerRow, 1).getValues();
  for (let i = names.length - 1; i >= 0; i--) {
    if (String(names[i][0]).trim() !== '') return t.headerRow + 1 + i;
  }
  return t.headerRow;
}

function where_(t, firstRow, n) {
  return { spreadsheet: t.ss.getName(), sheet: t.sheet.getName(), row: firstRow, rows: n };
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('PIN');
    if (!expected) return json_({ ok: false, error: 'PIN is not configured in Script properties.' });
    if (String(body.pin || '') !== String(expected)) return json_({ ok: false, error: 'Wrong PIN.' });

    if (body.action === 'verify') {
      const t = getTable_();
      return json_({ ok: true, spreadsheet: t.ss.getName(), sheet: t.sheet.getName(), headers: t.headers, lastRow: lastNamedRow_(t) });
    }
    if (body.action === 'add') return json_(addEntry_(body.entry || {}));
    if (body.action === 'setStatus') return json_(setStatus_(body));
    if (body.action === 'update') return json_(updateVariety_(body));
    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/**
 * Open the web app URL in a browser to check the setup: which version is deployed,
 * which file and tab it writes to, and the last dahlia it sees there.
 */
function doGet() {
  try {
    const t = getTable_();
    const last = lastNamedRow_(t);
    const lastValues = last > t.headerRow
      ? t.sheet.getRange(last, 1, 1, t.headers.length).getValues()[0]
      : [];
    const lastEntry = {};
    t.headers.forEach(function (h, i) { if (h) lastEntry[h] = lastValues[i]; });
    return json_({
      ok: true,
      version: SCRIPT_VERSION,
      spreadsheet: t.ss.getName(),
      spreadsheetId: t.ss.getId(),
      tab: t.sheet.getName(),
      tabIsFirst: t.ss.getSheets()[0].getSheetId() === t.sheet.getSheetId(),
      headerRow: t.headerRow,
      headers: t.headers,
      lastDahliaRow: last,
      lastRowWithAnything: t.sheet.getLastRow(),
      lastDahlia: lastEntry,
      pinConfigured: !!PropertiesService.getScriptProperties().getProperty('PIN'),
    });
  } catch (err) {
    return json_({ ok: false, version: SCRIPT_VERSION, error: String(err && err.message || err) });
  }
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
    'Dahlia Number': numberValue_(entry.number),
    'Name': name,
    'Dead or Alive': String(entry.status || 'Alive').trim(),
    'Height (cm)': height,
    'Colors': colors,
    'Type': String(entry.type || '').trim(),
  };

  let result;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const t = getTable_();
    const start = lastNamedRow_(t) + 1;
    const maxRows = t.sheet.getMaxRows();
    if (start + count - 1 > maxRows) t.sheet.insertRowsAfter(maxRows, start + count - 1 - maxRows);

    // Write only the columns we know, so formulas or other columns in those rows are left alone.
    Object.keys(values).forEach(function (h) {
      const col = t.headers.indexOf(h);
      if (col < 0) return;
      const block = [];
      for (let i = 0; i < count; i++) block.push([values[h]]);
      t.sheet.getRange(start, col + 1, count, 1).setValues(block);
    });
    SpreadsheetApp.flush();
    result = where_(t, start, count);
  } finally {
    lock.releaseLock();
  }
  result.ok = true;
  result.added = count;
  return result;
}

/** "110" → 110 so new numbers match the existing numeric cells; anything else stays text. */
function numberValue_(v) {
  const str = String(v == null ? '' : v).trim();
  return /^\d+$/.test(str) ? Number(str) : str;
}

function colorsValue_(colors) {
  return (Array.isArray(colors) ? colors : String(colors || '').split(','))
    .map(function (c) { return String(c).trim(); })
    .filter(Boolean)
    .join(', ');
}

/**
 * Edit one variety. `changes` may hold name, number, height, colors, type (only keys present
 * are changed, on every row of the variety). `alive` / `dead` are the wanted tuber counts:
 * extra rows are deleted (newest first), missing rows are inserted right after the variety.
 */
function updateVariety_(body) {
  const original = String(body.name || '').trim();
  if (!original) return { ok: false, error: 'Name is required.' };
  const changes = body.changes || {};
  const wantAlive = Math.floor(Number(body.alive));
  const wantDead = Math.floor(Number(body.dead));
  if (!(wantAlive >= 0 && wantDead >= 0 && wantAlive + wantDead <= 500)) {
    return { ok: false, error: 'Tuber counts are out of range.' };
  }

  const fieldValues = {};
  if ('name' in changes) {
    const n = String(changes.name || '').trim();
    if (!n) return { ok: false, error: 'Name cannot be empty.' };
    fieldValues['Name'] = n;
  }
  if ('number' in changes) fieldValues['Dahlia Number'] = numberValue_(changes.number);
  if ('height' in changes) {
    const h = changes.height === '' || changes.height == null ? '' : Number(changes.height);
    if (h !== '' && !(h > 0 && h < 1000)) return { ok: false, error: 'Height looks wrong.' };
    fieldValues['Height (cm)'] = h;
  }
  if ('colors' in changes) fieldValues['Colors'] = colorsValue_(changes.colors);
  if ('type' in changes) fieldValues['Type'] = String(changes.type || '').trim();
  const newName = fieldValues['Name'] || original;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const t = getTable_();
    const sheet = t.sheet;
    const first = t.headerRow + 1;
    const last = lastNamedRow_(t);
    if (last < first) return { ok: false, error: 'The sheet is empty.' };
    const nCols = t.headers.length;
    const col = function (h) { return t.headers.indexOf(h); };
    const nameCol = col('Name');
    const statusCol = col('Dead or Alive');
    if (statusCol < 0) return { ok: false, error: 'Column "Dead or Alive" not found.' };

    const block = sheet.getRange(first, 1, last - first + 1, nCols).getValues();
    const mine = [];
    for (let i = 0; i < block.length; i++) {
      const n = String(block[i][nameCol]).trim();
      if (n === original) mine.push(i);
      else if (newName !== original && n.toLowerCase() === newName.toLowerCase()) {
        return { ok: false, error: 'A variety called "' + newName + '" already exists.' };
      }
    }
    if (!mine.length) return { ok: false, error: 'Variety "' + original + '" was not found in the sheet.' };

    const statusOf = function (i) { return isDead_(block[i][statusCol]); };
    const aliveNow = mine.filter(function (i) { return !statusOf(i); }).length;
    const deadNow = mine.length - aliveNow;
    if (Math.max(0, wantAlive - aliveNow) + Math.max(0, wantDead - deadNow) > MAX_ROWS_PER_REQUEST) {
      return { ok: false, error: 'You can add at most ' + MAX_ROWS_PER_REQUEST + ' tubers at a time.' };
    }

    // 1) Field changes on every row of the variety (column by column, known columns only).
    Object.keys(fieldValues).forEach(function (h) {
      const c = col(h);
      if (c < 0) return;
      mine.forEach(function (i) { block[i][c] = fieldValues[h]; });
      const top = mine[0], bottom = mine[mine.length - 1];
      const colValues = [];
      for (let i = top; i <= bottom; i++) colValues.push([block[i][c]]);
      sheet.getRange(first + top, c + 1, bottom - top + 1, 1).setValues(colValues);
    });

    // 2) Tuber counts.
    const aliveRows = mine.filter(function (i) { return !isDead_(block[i][statusCol]); });
    const deadRows = mine.filter(function (i) { return isDead_(block[i][statusCol]); });
    const toDelete = aliveRows.slice(wantAlive).concat(deadRows.slice(wantDead))
      .map(function (i) { return first + i; })
      .sort(function (a, b) { return b - a; });
    const addAlive = Math.max(0, wantAlive - aliveRows.length);
    const addDead = Math.max(0, wantDead - deadRows.length);

    // Template for new rows: the variety's first row, after the field changes.
    const template = block[mine[0]].slice();
    toDelete.forEach(function (r) { sheet.deleteRow(r); });

    const toAdd = addAlive + addDead;
    if (toAdd > 0) {
      // Insert right after the variety's last remaining row (or after the table if none remain).
      const kept = mine.filter(function (i) { return toDelete.indexOf(first + i) < 0; });
      let after;
      if (kept.length) {
        const lastKept = kept[kept.length - 1];
        const removedAbove = toDelete.filter(function (r) { return r < first + lastKept; }).length;
        after = first + lastKept - removedAbove;
      } else {
        after = lastNamedRow_(t);
      }
      sheet.insertRowsAfter(after, toAdd);
      const known = ['Dahlia Number', 'Name', 'Dead or Alive', 'Height (cm)', 'Colors', 'Type'];
      known.forEach(function (h) {
        const c = col(h);
        if (c < 0) return;
        const vals = [];
        for (let k = 0; k < toAdd; k++) {
          vals.push([h === 'Dead or Alive' ? (k < addAlive ? 'Alive' : 'Dead') : template[c]]);
        }
        sheet.getRange(after + 1, c + 1, toAdd, 1).setValues(vals);
      });
    }
    SpreadsheetApp.flush();
    return {
      ok: true,
      name: newName,
      alive: wantAlive,
      dead: wantDead,
      deleted: toDelete.length,
      added: toAdd,
      sheet: sheet.getName(),
    };
  } finally {
    lock.releaseLock();
  }
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
    const t = getTable_();
    const sheet = t.sheet;
    const first = t.headerRow + 1;
    const lastRow = lastNamedRow_(t);
    if (lastRow < first) return { ok: false, error: 'The sheet is empty.' };
    const nameCol = t.headers.indexOf('Name');
    const statusCol = t.headers.indexOf('Dead or Alive');
    if (statusCol < 0) return { ok: false, error: 'Column "Dead or Alive" not found.' };

    const names = sheet.getRange(first, nameCol + 1, lastRow - first + 1, 1).getValues();
    const statusRange = sheet.getRange(first, statusCol + 1, lastRow - first + 1, 1);
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
    SpreadsheetApp.flush();
    return { ok: true, changed: changed, spreadsheet: t.ss.getName(), sheet: sheet.getName() };
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
