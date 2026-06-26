/* ============================================================
   gate.js — password gate (prompt + sessionStorage)
   Asks once per browser session; re-asks when the tab closes.
   Password is configured in js/config.js.
   ============================================================ */

const SESSION_KEY = 'mm:unlocked';

// SHA-256 → hex. Exposed globally so you can generate a new hash
// from the console:  await mmHash('your-new-password')
async function mmHash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Password hash → paste into js/config.js:', hex);
  return hex;
}
window.mmHash = mmHash;

function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

async function tryUnlock(input) {
  const target = (window.MM_CONFIG && window.MM_CONFIG.passwordHash) || '';
  const hex = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
    .then(buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''));
  if (hex === target) {
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }
  return false;
}

function initGate() {
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const inputEl = document.getElementById('gate-input');
  const errEl = document.getElementById('gate-err');

  if (isUnlocked()) { gate.classList.add('gate-hidden'); return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const ok = await tryUnlock(inputEl.value);
    if (ok) {
      gate.classList.add('gate-hidden');
      inputEl.value = '';
    } else {
      errEl.textContent = 'Not quite. Try again.';
      inputEl.value = '';
      inputEl.focus();
    }
  });

  setTimeout(() => inputEl && inputEl.focus(), 100);
}
