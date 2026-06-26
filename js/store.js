/* ============================================================
   store.js — localStorage persistence layer
   All interactive state lives here, per-device.
   ============================================================ */

const Store = (() => {
  const PREFIX = 'mm:'; // manifesting-me namespace

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {}
  }
  function remove(key) { localStorage.removeItem(PREFIX + key); }

  // Export every mm:* key as one object (for backup)
  function exportAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out[k] = localStorage.getItem(k);
    }
    return out;
  }
  function importAll(obj) {
    Object.entries(obj).forEach(([k, v]) => {
      if (k.startsWith(PREFIX)) localStorage.setItem(k, v);
    });
  }

  return { get, set, remove, exportAll, importAll };
})();

/* — Bind a checkbox to persistent storage by id —
   Usage: data-persist="someUniqueKey" on the checkbox. */
function bindPersistentChecks(root = document) {
  root.querySelectorAll('input[type="checkbox"][data-persist]').forEach(cb => {
    const key = 'chk:' + cb.dataset.persist;
    cb.checked = Store.get(key, false);
    cb.addEventListener('change', () => {
      Store.set(key, cb.checked);
      cb.dispatchEvent(new CustomEvent('persisted', { bubbles: true }));
    });
  });
}

/* — Bind text/textarea inputs by data-persist — */
function bindPersistentFields(root = document) {
  root.querySelectorAll('input[data-persist-field], textarea[data-persist-field], select[data-persist-field]').forEach(el => {
    const key = 'fld:' + el.dataset.persistField;
    const saved = Store.get(key, null);
    if (saved !== null) el.value = saved;
    el.addEventListener('input', () => Store.set(key, el.value));
    el.addEventListener('change', () => Store.set(key, el.value));
  });
}
