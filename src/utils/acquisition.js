// Capture first-touch de la source d'acquisition (?ref / utm_source).
// La 1re source vue est mémorisée et n'est jamais écrasée ensuite.
const KEY = 'acq_source';

export function captureAcquisition() {
  try {
    if (localStorage.getItem(KEY)) return;            // first-touch
    const p = new URLSearchParams(window.location.search);
    const ref = (p.get('ref') || p.get('utm_source') || '').trim().toLowerCase();
    if (ref) {
      localStorage.setItem(KEY, ref.slice(0, 40));
      localStorage.setItem('acq_at', new Date().toISOString());
    }
  } catch (_) {}
}

export function getAcquisitionSource() {
  try { return localStorage.getItem(KEY) || ''; } catch (_) { return ''; }
}