/* ============================================================
   brief.js — renders the weekly brief into the Brief view.
   Current week comes from data/brief.json. A "past weeks" picker
   (data/weeks/index.json + data/weeks/<key>.json) lets you browse
   earlier weeks. Checkboxes persist per week.
   ============================================================ */

const DOMAIN_META = {
  health:    { label: 'Health',    icon: '<path d="M20 8.5C20 5.5 17.8 4 15.7 4 14 4 12.6 5 12 6c-.6-1-2-2-3.7-2C6.2 4 4 5.5 4 8.5c0 4.5 8 11 8 11s8-6.5 8-11Z"/>' },
  abundance: { label: 'Abundance', icon: '<path d="M12 3v18M8 6h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7"/>' },
  business:  { label: 'Business',  icon: '<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' },
  love:      { label: 'Love',      icon: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z"/>' },
  home:      { label: 'Home',      icon: '<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/>' }
};
const DOMAIN_ORDER = ['health', 'abundance', 'business', 'love', 'home'];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function moonGlyph(phase) {
  const p = (phase || '').toLowerCase();
  let lit = 0.5, waning = false;
  if (p.includes('new')) lit = 0.04;
  else if (p.includes('full')) lit = 1;
  else if (p.includes('first quarter')) { lit = 0.5; waning = false; }
  else if (p.includes('last quarter')) { lit = 0.5; waning = true; }
  else if (p.includes('waxing gibbous')) { lit = 0.8; waning = false; }
  else if (p.includes('waning gibbous')) { lit = 0.8; waning = true; }
  else if (p.includes('waxing')) { lit = 0.3; waning = false; }
  else if (p.includes('waning')) { lit = 0.3; waning = true; }
  const r = 9, cx = 11, cy = 11;
  const uid = 'm' + Math.random().toString(36).slice(2, 8);
  const offset = (waning ? -1 : 1) * (1 - lit) * r;
  return `<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--cream-soft)" stroke="var(--taupe-deep)" stroke-width="1"/>
    <clipPath id="${uid}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#${uid})">
      <ellipse cx="${cx + offset}" cy="${cy}" rx="${r}" ry="${r}" fill="var(--brass)"/>
    </g>
  </svg>`;
}

function calendarStrip(days) {
  if (!Array.isArray(days) || !days.length) return '';
  const cells = days.map(d => {
    const flag = d.flag ? `<span class="cal-flag">${esc(d.flag)}</span>` : '';
    return `<div class="cal-cell${d.flag === 'Full Moon' || d.flag === 'New Moon' ? ' cal-cell-lunar' : ''}">
      <div class="cal-dow">${esc(d.dow)}</div>
      <div class="cal-date">${esc(d.date)}</div>
      <div class="cal-moon">${moonGlyph(d.phase)}</div>
      <div class="cal-phase">${esc(d.phase)}</div>
      <div class="cal-sign">${esc(d.sign)}</div>
      ${flag}
    </div>`;
  }).join('');
  return `<div class="card cal-card">
    <span class="eyebrow">Lunar Calendar</span>
    <div class="cal-strip">${cells}</div>
  </div>`;
}

function ringSVG(key) {
  const r = 22, c = 2 * Math.PI * r;
  return `<div class="ring-wrap" data-ring="${key}">
    <svg class="ring" width="58" height="58">
      <circle class="track" cx="29" cy="29" r="${r}"></circle>
      <circle class="fill" cx="29" cy="29" r="${r}" style="stroke-dasharray:${c};stroke-dashoffset:${c}"></circle>
    </svg>
    <span class="ring-label ring-count">0/0</span>
  </div>`;
}

function domainCard(key, data, weekKey) {
  const meta = DOMAIN_META[key];
  const actions = (data.actions || []).map((a, i) => {
    const pkey = `${key}.${weekKey}.${i}`;
    return `<div class="action">
      <input type="checkbox" id="b_${pkey}" data-persist="${pkey}">
      <label for="b_${pkey}">${esc(a)}</label>
    </div>`;
  }).join('');
  return `<div class="card brief-domain">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
      <div style="display:flex;align-items:center;gap:.6rem">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--brass)" stroke-width="1.4">${meta.icon}</svg>
        <h3 style="margin:0">${meta.label}</h3>
      </div>
      ${ringSVG(key + '.' + weekKey)}
    </div>
    <div style="margin-top:.75rem">${actions}</div>
  </div>`;
}

/* Build the full brief HTML for a given brief object. */
function briefBodyHTML(data, isPast) {
  const weekKey = (data.weekOf || 'week').replace(/[^a-z0-9]+/gi, '').toLowerCase();

  const transits = (data.transits || []).map(t =>
    `<div class="action" style="cursor:default">
       ${t.flag ? '<span class="pill brass" style="margin-top:2px">Flag</span>' : '<span class="pill muted" style="margin-top:2px">Note</span>'}
       <div style="flex:1"><strong>${esc(t.title)}</strong><div style="font-size:.88rem;color:var(--charcoal-2);margin-top:.2rem">${esc(t.note)}</div></div>
     </div>`).join('');

  const domains = DOMAIN_ORDER
    .filter(k => data.domains && data.domains[k])
    .map(k => domainCard(k, data.domains[k], weekKey)).join('');

  const content = data.content ? `
    <div class="card">
      <span class="eyebrow">Content this week</span>
      <div class="grid-3">
        <div><h4 style="color:var(--brass-deep)">DemiPolished</h4>${(data.content.dp||[]).map(x=>`<p style="font-size:.85rem;color:var(--charcoal-2);margin:.3rem 0">${esc(x)}</p>`).join('')}</div>
        <div><h4 style="color:var(--brass-deep)">BGGG</h4>${(data.content.bggg||[]).map(x=>`<p style="font-size:.85rem;color:var(--charcoal-2);margin:.3rem 0">${esc(x)}</p>`).join('')}</div>
        <div><h4 style="color:var(--brass-deep)">Shoot Day</h4>${(data.content.shoot||[]).map(x=>`<p style="font-size:.85rem;color:var(--charcoal-2);margin:.3rem 0">${esc(x)}</p>`).join('')}</div>
      </div>
    </div>` : '';

  const radar = (data.radar || []).map(r =>
    `<div class="action" style="cursor:default"><span style="color:var(--brass)">✦</span><div style="flex:1;font-size:.88rem;color:var(--charcoal-2)">${esc(r)}</div></div>`
  ).join('');

  return `
    <div class="card" style="text-align:center">
      <span class="eyebrow">Week of ${esc(data.weekOf || '')}${isPast ? ' · archived' : ''}</span>
      <h1 style="font-size:2.6rem;margin:.1rem 0">${esc(data.energyTone || '')}</h1>
      <p style="color:var(--charcoal-2);max-width:38ch;margin:.2rem auto 0">${esc(data.toneNote || '')}</p>
      ${data.quarterTheme ? `<div class="note" style="text-align:left;margin-top:1.2rem"><span class="note-label">This Quarter</span>${esc(data.quarterTheme)}</div>` : ''}
    </div>

    ${calendarStrip(data.days)}

    ${data.lunar ? `<div class="card">
      <span class="eyebrow">Lunar Weather</span>
      <h3 style="margin:.1rem 0 .5rem">${esc(data.lunar.event || '')}</h3>
      <p style="font-size:.9rem;color:var(--charcoal-3);margin-bottom:.6rem">${esc(data.lunar.sign || '')}</p>
      <p style="color:var(--charcoal-2)">${esc(data.lunar.weather || '')}</p>
    </div>` : ''}

    ${transits ? `<div class="card"><span class="eyebrow">Planetary Weather</span>${transits}</div>` : ''}

    <div style="text-align:center;margin:1.75rem 0 .75rem">
      <span class="eyebrow">Priority Actions</span>
    </div>
    ${domains}

    ${content}

    ${data.founderHour ? `<div class="card">
      <span class="eyebrow">Founder Hour</span>
      <p style="font-family:var(--serif);font-style:italic;font-size:1.2rem;line-height:1.5;color:var(--charcoal)">${esc(data.founderHour)}</p>
      <p style="font-size:.78rem;color:var(--charcoal-3);margin-top:.6rem">10 minutes · by hand · no editing</p>
    </div>` : ''}

    ${data.spiritual ? `<div class="card">
      <span class="eyebrow">Spiritual Alignment</span>
      <p style="color:var(--charcoal-2)">${esc(data.spiritual)}</p>
    </div>` : ''}

    ${data.mantra ? `<div class="card"><span class="eyebrow" style="text-align:center;display:block">This Week's Mantra</span><div class="mantra">${esc(data.mantra)}</div></div>` : ''}

    ${radar ? `<div class="card"><span class="eyebrow">On Your Radar</span>${radar}
      <p style="font-size:.78rem;color:var(--charcoal-3);margin-top:.6rem">Add these to your agenda. Ask about them when you're ready.</p></div>` : ''}
  `;
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

/* Render a brief object into #brief-body and wire persistence + rings. */
function paintBrief(data, isPast) {
  const body = document.getElementById('brief-body');
  if (!body) return;
  body.innerHTML = briefBodyHTML(data, isPast);
  bindPersistentChecks(body);
  if (window.updateAllRings) updateAllRings(body);
}

window.initBrief = async function () {
  const root = document.getElementById('brief-root');
  if (!root) return;

  let current;
  try {
    current = await fetchJSON('data/brief.json');
  } catch (e) {
    root.innerHTML = '<div class="card"><p>No brief loaded yet. Your Friday update will appear here once it syncs.</p></div>';
    return;
  }

  // Try the archive index (may not exist on older deploys)
  let index = [];
  try { index = await fetchJSON('data/weeks/index.json'); } catch (e) { index = []; }

  // Picker only if there's more than one week of history
  let pickerHTML = '';
  if (Array.isArray(index) && index.length > 1) {
    const opts = index.map(w =>
      `<option value="${esc(w.file)}"${w.current ? ' selected' : ''}>${esc(w.weekOf)}${w.current ? ' — current' : ''}</option>`
    ).join('');
    pickerHTML = `<div class="no-print" style="display:flex;align-items:center;gap:.6rem;margin:0 0 1rem">
      <label for="week-select" style="font-size:.62rem;text-transform:uppercase;letter-spacing:.2em;color:var(--brass-deep);font-weight:600">Week</label>
      <select id="week-select" style="max-width:280px;margin-bottom:0">${opts}</select>
    </div>`;
  }

  root.innerHTML = pickerHTML + '<div id="brief-body"></div>';
  paintBrief(current, false);

  const sel = document.getElementById('week-select');
  if (sel) {
    sel.addEventListener('change', async () => {
      const cur = index.find(w => w.current);
      const isCurrent = cur && sel.value === cur.file;
      try {
        const data = isCurrent ? current : await fetchJSON('data/weeks/' + sel.value);
        paintBrief(data, !isCurrent);
        window.scrollTo({ top: 0, behavior: 'instant' });
      } catch (e) {
        // leave current view if a past file fails to load
      }
    });
  }
};
