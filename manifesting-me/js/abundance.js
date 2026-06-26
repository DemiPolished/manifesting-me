/* ============================================================
   abundance.js — live income-goal progress bars
   ============================================================ */
window.initAbundance = function () {
  const root = document.getElementById('view-abundance');
  if (!root) return;

  function updateGoal(goal) {
    const cur = parseFloat(goal.querySelector('.goal-current').value) || 0;
    const tgt = parseFloat(goal.querySelector('.goal-target').value) || 0;
    const pct = tgt > 0 ? Math.min(100, (cur / tgt) * 100) : 0;
    goal.querySelector('.bar-fill').style.width = pct + '%';
    const lbl = goal.querySelector('.goal-pct');
    if (tgt > 0) {
      lbl.textContent = Math.round(pct) + '% · $' + cur.toLocaleString() + ' of $' + tgt.toLocaleString();
    } else {
      lbl.textContent = '—';
    }
  }

  root.querySelectorAll('[data-goal]').forEach(goal => {
    goal.querySelectorAll('input[type="number"]').forEach(inp => {
      inp.addEventListener('input', () => updateGoal(goal));
    });
    updateGoal(goal); // initial render from saved values
  });
};
