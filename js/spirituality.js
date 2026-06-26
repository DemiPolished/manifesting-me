/* ============================================================
   spirituality.js — syncs the Lunar Cycle block from brief.json
   so the phase always matches the current Friday brief.
   ============================================================ */
window.initSpirituality = async function () {
  const ev = document.getElementById('lunar-event');
  const sg = document.getElementById('lunar-sign');
  const wx = document.getElementById('lunar-weather');
  if (!ev) return;
  try {
    const res = await fetch('data/brief.json', { cache: 'no-cache' });
    const d = await res.json();
    if (d.lunar) {
      ev.textContent = d.lunar.event || '—';
      sg.textContent = d.lunar.sign || '';
      wx.textContent = d.lunar.weather || '';
    }
  } catch (e) {
    ev.textContent = 'Lunar data syncs with your weekly brief.';
  }
};
