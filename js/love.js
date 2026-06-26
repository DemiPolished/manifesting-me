/* ============================================================
   love.js — pulls Venus/partnership transit notes from brief.json
   ============================================================ */
window.initLove = async function () {
  const body = document.getElementById('love-venus-body');
  if (!body) return;
  try {
    const res = await fetch('data/brief.json', { cache: 'no-cache' });
    const d = await res.json();
    const hits = (d.transits || []).filter(t =>
      /venus|jupiter|7th|partnership|love/i.test((t.title || '') + ' ' + (t.note || ''))
    );
    if (hits.length) {
      body.innerHTML = hits.map(t =>
        `<p style="margin:0 0 .6rem"><strong>${t.title.replace(/</g,'&lt;')}</strong><br>
         <span style="color:var(--charcoal-2);font-size:.92rem">${t.note.replace(/</g,'&lt;')}</span></p>`
      ).join('');
    } else {
      body.innerHTML = '<p style="color:var(--charcoal-3)">No Venus-specific flags this week. The standing arc below still applies.</p>';
    }
  } catch (e) {
    body.innerHTML = '<p style="color:var(--charcoal-3)">Venus notes sync with your weekly brief.</p>';
  }
};
