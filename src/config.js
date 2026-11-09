// URL of the deployed Google Apps Script web app (see apps-script/README.md).
// Writes are protected by the PIN stored in the script's properties.
// Set VITE_SHEET_WRITE_URL in Netlify to override; empty hides the write buttons.
export const SHEET_WRITE_URL =
  import.meta.env.VITE_SHEET_WRITE_URL ??
  'https://script.google.com/macros/s/AKfycby4pICP4_CChDhjAKth5WKBW_RM5bHZONvFQ3SBVDcFJJWuA82Rfc6QPfAoTy2DeTP2/exec'
