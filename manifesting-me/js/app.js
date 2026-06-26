/* ============================================================
   app.js — shell controller
   Tab navigation, section loading, progress rings, collapsibles.
   ============================================================ */

const SECTIONS = ['brief', 'health', 'abundance', 'spirituality', 'business', 'love', 'home'];
const loaded = {};

/* — Load a section partial once, inject into its view — */
async function loadSection(name) {
  if (loaded[name]) return;
  const view = document.getElementById('view-' + name);
  try {
    const res = await fetch('sections/' + name + '.html');
    view.innerHTML = await res.text();
  } catch (e) {
    view.innerHTML = '<div class="card"><p>Could not load this section offline yet. Open it once while online.</p></div>';
  }
  loaded[name] = true;
  bindPersistentChecks(view);
  bindPersistentFields(view);
  initCollapsibles(view);
  // Per-section init hooks
  if (name === 'brief' && window.initBrief) await window.initBrief();
  if (name === 'abundance' && window.initAbundance) window.initAbundance();
  if (name === 'spirituality' && window.initSpirituality) window.initSpirituality();
  if (name === 'love' && window.initLove) window.initLove();
  updateAllRings(view);
}

/* — Tab switching — */
function showSection(name) {
  SECTIONS.forEach(s => {
    document.getElementById('view-' + s).classList.toggle('active', s === name);
    const tab = document.querySelector('.tab[data-section="' + s + '"]');
    if (tab) tab.classList.toggle('active', s === name);
  });
  loadSection(name);
  window.scrollTo({ top: 0, behavior: 'instant' });
  Store.set('lastSection', name);
}

/* — Progress ring renderer —
   <div class="ring-wrap" data-ring="domainKey" data-total="3">...</div>
   Counts checked persistent boxes whose data-persist starts with domainKey. */
function updateRing(wrap) {
  const key = wrap.dataset.ring;
  const checks = document.querySelectorAll('input[type="checkbox"][data-persist^="' + key + '"]');
  const total = checks.length || parseInt(wrap.dataset.total || '0', 10);
  let done = 0; checks.forEach(c => { if (c.checked) done++; });
  const pct = total ? done / total : 0;
  const r = 22, c = 2 * Math.PI * r;
  wrap.querySelector('.fill').style.strokeDasharray = c;
  wrap.querySelector('.fill').style.strokeDashoffset = c * (1 - pct);
  const lbl = wrap.querySelector('.ring-count');
  if (lbl) lbl.textContent = done + '/' + total;
}
function updateAllRings(root = document) {
  root.querySelectorAll('.ring-wrap[data-ring]').forEach(updateRing);
}

/* — Collapsibles — */
function initCollapsibles(root = document) {
  root.querySelectorAll('.collapsible > .collapse-head').forEach(head => {
    if (head.dataset.bound) return;
    head.dataset.bound = '1';
    head.addEventListener('click', () => head.parentElement.classList.toggle('open'));
  });
}

/* — Boot — */
document.addEventListener('DOMContentLoaded', () => {
  // Masthead text from config
  if (window.MM_CONFIG) {
    const wm = document.querySelector('.masthead .wordmark');
    const tg = document.querySelector('.masthead .tagline');
    if (wm) wm.textContent = MM_CONFIG.appName;
    if (tg) tg.textContent = MM_CONFIG.tagline;
  }

  initGate();

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => showSection(tab.dataset.section));
  });

  // Re-render rings whenever any checkbox persists
  document.addEventListener('persisted', () => updateAllRings());

  const start = Store.get('lastSection', 'brief');
  showSection(SECTIONS.includes(start) ? start : 'brief');

  // Register service worker for offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
});
